# Practice Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Cognitive Mode into a free, local-only DSA practice coach: practice sessions on LeetCode, GeeksforGeeks and takeuforward, a 4-level hint ladder injected into the user's own AI chat prompt, Clean/Hinted/Assisted/Unsolved outcomes, a 3/7/21-day re-solve queue, topic readiness, and a rewritten website.

**Architecture:**
- One MV3 content bundle routes by host: practice sites get a tracker plus a floating pill, AI chats get the interceptor plus either the hint ladder or the legacy Everyday gate, and the landing page gets the install handshake.
- All rules are pure TypeScript in `src/practice/*` over a single `chrome.storage.local` key (`cm_practice_v1`).
- The background worker migrates settings and keeps a due-count badge.
- The Next.js site is rewritten around the new promise.

**Tech Stack:** TypeScript 6, React 19, Tailwind 4, Vite 8 (extension). Next.js 16.2 (web). `node --test` for tests.

**Spec:** `docs/superpowers/specs/2026-11-22-practice-mode-design.md`. Read §9 (data model and rules), §10 (hint ladder, exact prompt copy), §11 (practice pages) and Appendix A (observed DOM) before Tasks 2, 3, 5 and 7.

## Global Constraints

- **No backend and no outbound requests carrying user data.** No API keys. No new runtime dependencies; dev dependencies only if a task says so (none do).
- **Practice mode never adds friction.** No timers, no mandatory text, no minimum character counts. Esc always closes the hint ladder without sending.
- **Storage keys:** practice state `cm_practice_v1`; settings `cognitive_settings`. The legacy keys `cognitive_entries`, `cognitivemode_stats` and `cognitive_daily_bypass` must be left untouched.
- **Time constants:**

  | Constant | Value |
  |---|---|
  | active gap | 2 min |
  | stale after | 6 h |
  | active window | 90 min |
  | restart after finish | 30 min |
  | trivial attempt | active time < 2 min, 0 hints, 0 submits |
  | review intervals | +3 d, +7 d, +21 d |
  | due-early window | 12 h |
  | caps | 50 attempts per problem, 2000 problems |

- **Statement limits:** store ≤ 1500 chars. Include in the prompt ≤ 800 chars, and only when the user's own text is < 280 chars.
- **Extension:** version `0.3.0`; permissions `["storage", "alarms"]`.
- **AI hosts:** `https://chatgpt.com/*`, `https://claude.ai/*`, `https://gemini.google.com/*`, `https://perplexity.ai/*`, `https://www.perplexity.ai/*`, `https://chat.deepseek.com/*`, `https://v0.app/*`, `https://v0.dev/*`, `https://bolt.new/*`.
- **Practice hosts:** `https://leetcode.com/*`, `https://www.geeksforgeeks.org/*`, `https://takeuforward.org/*`.
- **Pure modules** (`src/practice/types.ts`, `topics.ts`, `platforms.ts`, `model.ts`, `prompt.ts`, and `src/content/hintSend.ts`) use no `chrome.*`, `window` or `document`.
- **Any module a test imports**, directly or transitively (the pure modules plus `src/practice/store.ts`, `src/content/storage.ts`, `src/content/interceptor.ts` and `src/content/composer.ts`):
  - must write runtime relative imports with explicit `.ts` extensions and use `import type` for types;
  - may touch `chrome`/`document` only inside functions, never at module top level.
  - Tests import these files directly. Node ≥ 22.18 type stripping is required; document this in `apps/extension/README.md`.
- **Injected UI** renders inside a shadow root. Visual language: zinc-950 surfaces, emerald accent, uppercase mono micro-labels, as in `src/content/Overlay.tsx`.
- **Copy tone:** coach, not cop. Never "cheated" or "failed"; use "needed the solution" and "didn't solve".
- **Git:** commit only with the owner's OK (global rule). Each task's last step names the checkpoint commit. If commits aren't approved yet, leave the changes in the working tree and continue.

## Review Focus

1. **The AI site ignores our text insertion** (editor rejects the synthetic paste). Expected: the prompt is NOT sent, the full prompt is copied, and the overlay says so. Pinned in Task 6 (`hintSend` tests) and verified live in Task 10.
2. **The user asks the AI something unrelated during a practice session.** Expected: one click or keypress ("Send as is") or Esc, with no timer and nothing recorded. Pinned in Task 6.
3. **Two problem tabs open, or LeetCode's in-app navigation to the next problem.** Expected: the active problem follows the tab the user is looking at. Pinned in Task 2 (`heartbeat` sets `activeKey`) and Task 7 (URL polling).
4. **Corrupt or foreign data in `cm_practice_v1`.** Expected: no crash; bad records dropped and the rest kept. Pinned in Task 2 (`coerceState`).
5. **A platform redesign breaks title/difficulty extraction.** Expected: the URL still identifies the problem and the title falls back to the slug ("two-sum" → "Two Sum"). Pinned in Task 1 (`titleFromSlug`) and Task 7.

---

### Task 1: Practice types, topic normalization, platform parsing

**Files:**
- Create: `apps/extension/src/practice/types.ts`, `apps/extension/src/practice/topics.ts`, `apps/extension/src/practice/platforms.ts`
- Test: `apps/extension/tests/practice-platforms.test.mjs`

**Interfaces:**
- Produces, in `types.ts` (types only):
  - `Platform = 'leetcode' | 'gfg' | 'tuf'`
  - `Outcome = 'clean' | 'hinted' | 'assisted' | 'unsolved'`
  - `HintLevel = 0|1|2|3|4`
  - `HintRequestLevel = Exclude<HintLevel, 0>`
  - `ProblemRef { platform; slug; title; url; number?: string; difficulty?: string; topics: string[] }`
  - `Attempt { startedAt; lastActiveAt; activeMs; maxHintLevel: HintLevel; hintRequests; submits; approach?: string; outcome?: Outcome; endedAt?: number; autoClosed?: boolean }`
  - `ProblemRecord extends ProblemRef { key: string; statement?: string; attempts: Attempt[]; review?: { stage: 1|2|3; dueAt: number }; graduatedAt?: number }`
  - `PracticeState { version: 1; problems: Record<string, ProblemRecord>; activeKey: string | null }`
  - `TopicReadiness { topic: string; attempted: number; clean: number }`
  - `WeeklyStats { solved: number; clean: number; unsolved: number; streakDays: number }`
- Produces, in `topics.ts`:
  - `normalizeTopic(name: string): string | null`
  - `normalizeTopics(names: readonly string[]): string[]` (order-preserving, deduped)
- Produces, in `platforms.ts`:
  - `PLATFORM_LABELS: Record<Platform, string>` = `{ leetcode: 'LeetCode', gfg: 'GeeksforGeeks', tuf: 'takeUforward' }`
  - `isPracticeHost(hostname: string): boolean`
  - `parseProblemUrl(href: string): { platform: Platform; slug: string; url: string } | null`
  - `titleFromSlug(slug: string): string`
  - `stripNumberPrefix(text: string): { number?: string; title: string }`
  - `parseDifficultyText(text: string): string | undefined`
  - `parseLeetCodeNextData(raw: string | null | undefined, slug: string): ParsedMeta | null`
  - `parseGfgNextData(raw: string | null | undefined, slug: string): ParsedMeta | null`
  - `ParsedMeta = { title?: string; number?: string; difficulty?: string; topics: string[]; contentHtml?: string }`

- [ ] **Step 1: Write failing tests** in `tests/practice-platforms.test.mjs` (import from `'../src/practice/platforms.ts'` and `'../src/practice/topics.ts'`):
  - `parseProblemUrl recognizes LeetCode problem pages`:
    - `'https://leetcode.com/problems/two-sum/description/'` → `{ platform: 'leetcode', slug: 'two-sum', url: 'https://leetcode.com/problems/two-sum/' }`.
    - `'https://leetcode.com/problems/two-sum/submissions/123/?envType=x'` → same object.
    - `'https://leetcode.com/problemset/'` → `null`.
  - `parseProblemUrl recognizes GeeksforGeeks problem pages`: `'https://www.geeksforgeeks.org/problems/key-pair5616/1?utm=x#y'` → `{ platform: 'gfg', slug: 'key-pair5616', url: 'https://www.geeksforgeeks.org/problems/key-pair5616/1' }`.
  - `parseProblemUrl recognizes takeuforward practice pages`:
    - `'https://takeuforward.org/practice/dsa/linear-search'` → `{ platform: 'tuf', slug: 'linear-search', url: 'https://takeuforward.org/practice/dsa/linear-search' }`.
    - `'https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet'` → `null`.
    - `'https://chatgpt.com/'` → `null`.
  - `isPracticeHost`: true for `leetcode.com`, `www.geeksforgeeks.org`, `takeuforward.org`; false for `chatgpt.com`.
  - `titleFromSlug`: `'two-sum'` → `'Two Sum'`; `'key-pair5616'` → `'Key Pair5616'`.
  - `stripNumberPrefix`: `'838. Linear Search'` → `{ number: '838', title: 'Linear Search' }`; `'Two Sum'` → `{ title: 'Two Sum' }`.
  - `parseDifficultyText`: `'Difficulty: Easy'` → `'Easy'`; `'medium'` → `'Medium'`; `'Basic'` → `'Basic'`; `'Premium'` → `undefined`.
  - `parseLeetCodeNextData reads the question only when the slug matches`:
    - Input: JSON `{ props: { pageProps: { dehydratedState: { queries: [ { state: { data: { question: { titleSlug: 'two-sum', title: 'Two Sum', questionFrontendId: '1', difficulty: 'Easy', topicTags: [{ name: 'Array' }, { name: 'Hash Table' }], content: '<p>Given</p>' } } } } ] } } } }`.
    - Slug `'two-sum'` → `{ title: 'Two Sum', number: '1', difficulty: 'Easy', topics: ['Arrays', 'Hashing'], contentHtml: '<p>Given</p>' }`.
    - Slug `'3sum'` → `null`. `'not json'` → `null`. `undefined` → `null`.
  - `parseGfgNextData reads probData`: JSON `{ props: { pageProps: { initialState: { problemData: { allData: { probData: { slug: 'key-pair5616', problem_name: 'Two Sum - Pair with Given Sum', difficulty: 'Easy', tags: { topic_tags: ['Arrays', 'Hash'] } } } } } } } }` → `{ title: 'Two Sum - Pair with Given Sum', difficulty: 'Easy', topics: ['Arrays', 'Hashing'] }`.
  - `normalizeTopics folds plurals and synonyms`:
    - `['Array', 'Hash Table']` → `['Arrays', 'Hashing']`.
    - `['dp', 'Dynamic Programming']` → `['Dynamic Programming']`.
    - `['  Some New Topic ']` → `['Some New Topic']`.
    - `['']` → `[]`.
- [ ] **Step 2: Run and confirm they fail.** `cd apps/extension && node --test tests/practice-platforms.test.mjs` → FAIL (module not found).
- [ ] **Step 3: Implement the three modules.**
  - Synonym map in `topics.ts`, keyed by lowercased, whitespace-collapsed names. Plural folding: try the exact key, then the key with a trailing `s` removed. Canonical names:
    - Arrays, Strings, Hashing (hash, hash table, hash map, hashmap, hashing)
    - Two Pointers, Sliding Window, Linked Lists, Stacks, Queues
    - Heaps (heap, priority queue, heap (priority queue))
    - Trees (tree, binary tree), Binary Search Trees (bst, binary search tree)
    - Graphs, BFS (bfs, breadth-first search), DFS (dfs, depth-first search)
    - Dynamic Programming (dp, dynamic programming)
    - Greedy, Backtracking, Recursion, Binary Search, Sorting
    - Math (math, mathematical, mathematics)
    - Bit Manipulation (bit manipulation, bit magic)
    - Matrix, Tries, Prefix Sum, Union Find (union find, disjoint set, dsu)
  - Unknown names are title-cased as given.
  - `parseProblemUrl` uses `new URL()` and returns `null` on throw.
- [ ] **Step 4: Run and confirm they pass.** Same command → PASS.
- [ ] **Step 5: Checkpoint commit:** `feat(ext): add practice platform parsing and topic normalization`

### Task 2: Practice model (pure rules)

**Files:**
- Create: `apps/extension/src/practice/model.ts`
- Test: `apps/extension/tests/practice-model.test.mjs`

**Interfaces:**
- Consumes: Task 1 types and `normalizeTopics`.
- Produces (all pure; **never mutate inputs**; return new objects):
  - Constants: `ACTIVE_GAP_MS = 120_000`, `STALE_MS = 21_600_000`, `ACTIVE_WINDOW_MS = 5_400_000`, `RESTART_AFTER_FINISH_MS = 1_800_000`, `TRIVIAL_ACTIVE_MS = 120_000`, `DAY_MS = 86_400_000`, `REVIEW_INTERVAL_DAYS = [3, 7, 21]`, `DUE_EARLY_WINDOW_MS = 43_200_000`, `MAX_ATTEMPTS_PER_PROBLEM = 50`, `MAX_PROBLEMS = 2000`, `MAX_STATEMENT_CHARS = 1500`.
  - State helpers:
    - `createEmptyState(): PracticeState`
    - `problemKey(platform: Platform, slug: string): string` → `` `${platform}:${slug}` ``
    - `coerceState(value: unknown): PracticeState`
    - `trimState(state): PracticeState`
  - Attempt helpers:
    - `currentAttempt(record): Attempt | undefined` (the last attempt if unfinished)
    - `latestFinished(record): Attempt | undefined`
    - `activeTimeMs(attempt: Attempt, now: number, live: boolean): number`
  - Updates:
    - `normalize(state, now)`
    - `visit(state, ref: ProblemRef, now, statement?: string)`
    - `heartbeat(state, key, now)`
    - `recordHint(state, key, level: HintRequestLevel, now)`
    - `recordSubmit(state, key, now)`
    - `setApproach(state, key, text: string, now)`
    - `finishAttempt(state, key, outcome: Outcome, now)`
  - Queries:
    - `activePractice(state, now): ProblemRecord | null`
    - `deriveOutcome(level: HintLevel): 'clean' | 'hinted' | 'assisted'`
    - `dueProblems(state, now): ProblemRecord[]`
    - `upcomingReviews(state, now): ProblemRecord[]`
    - `topicReadiness(state): TopicReadiness[]`
    - `weeklyStats(state, now): WeeklyStats`

Rules are exactly spec §9, with one addition: **`heartbeat` also sets `activeKey = key`** (Review Focus 3). Local-day math (`end of local today`, streak days) uses `Date` local time; tests must build timestamps with `new Date(y, m, d, h, min).getTime()` so they pass in any timezone.

- [ ] **Step 1: Write failing tests** (import `'../src/practice/model.ts'`). Use a `deepFreeze` helper on every input state so mutations throw. Fixture `ref = { platform: 'leetcode', slug: 'two-sum', title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum/', number: '1', difficulty: 'Easy', topics: ['Arrays', 'Hashing'] }`, `t0 = new Date(2026, 10, 22, 10, 0).getTime()`.
  1. `visit creates a record, a first attempt and the active key`: record `leetcode:two-sum` exists; one attempt `{ startedAt: t0, lastActiveAt: t0, activeMs: 0, maxHintLevel: 0, hintRequests: 0, submits: 0 }`; `activeKey === 'leetcode:two-sum'`.
  2. `pings accumulate only gaps of at most 2 minutes`: heartbeat at t0+60s → `activeMs === 60_000`. Heartbeat at t0+60s+180s → `activeMs` still `60_000` and `lastActiveAt` updated.
  3. `visit refreshes metadata and keeps attempts`: visit with `title: 'two-sum'`, then with `ref` → `title === 'Two Sum'`, attempts length 1. A `statement` longer than 1500 chars is stored truncated to 1500.
  4. `a finished attempt is reused within 30 minutes and replaced after`: finish at t0+5m. Visit at t0+20m → still 1 attempt. Visit at t0+5m+31m → 2 attempts, the new one unfinished.
  5. `normalize drops trivial stale attempts and empty records`: visit at t0; `normalize(state, t0 + STALE_MS + 1)` → `problems` is `{}`.
  6. `normalize closes stale hinted attempts as unsolved and queues them`: visit, `recordHint(…, 2, t0+60s)`, normalize at `t0+60s+STALE_MS+1` → `outcome === 'unsolved'`, `autoClosed === true`, `endedAt === t0+60_000`, `review` equals `{ stage: 1, dueAt: t0+60_000 + 3*DAY_MS }`.
  7. `normalize closes stale unhinted work as unsolved without queueing`: heartbeats every 60s up to t0+3m, normalize after stale → `outcome === 'unsolved'`, `review === undefined`.
  8. `activePractice follows the 90-minute window and finished attempts`: record returned at t0+89m, `null` at t0+91m, and `null` right after `finishAttempt`.
  9. `recordHint keeps the highest level and counts requests`: levels 1, 3, 2 → `maxHintLevel === 3`, `hintRequests === 3`. On a finished attempt → state unchanged.
  10. `recordSubmit counts submits on the open attempt`: `submits === 1`.
  11. `heartbeat makes that problem the active one`: visit A, visit B, heartbeat A → `activeKey === 'leetcode:a'`.
  12. `deriveOutcome maps levels`: 0 → `'clean'`, 1 and 2 → `'hinted'`, 3 and 4 → `'assisted'`.
  13. `hinted, assisted and unsolved finishes queue a 3-day re-solve`: each → `review` equals `{ stage: 1, dueAt: now + 3*DAY_MS }`.
  14. `clean re-solves advance only when due`, after a hinted finish at T (due T+3d):
      - clean at T+1d (new attempt) → review unchanged;
      - clean at `T+3d-12h` → `{ stage: 2, dueAt: thatTime + 7*DAY_MS }`;
      - next due clean → stage 3 (+21d);
      - next due clean → `review === undefined` and `graduatedAt` set.
  15. `a hinted re-solve resets to stage 1`.
  16. `dueProblems includes reviews due by end of local today, sorted`: due 23:00 today is included, 00:30 tomorrow is excluded, sorted by `dueAt` ascending. `upcomingReviews` returns the excluded one.
  17. `topicReadiness uses each problem's latest finished outcome`: p1 (Arrays, Hashing) hinted then clean, p2 (Arrays) unsolved → `[{ topic: 'Arrays', attempted: 2, clean: 1 }, { topic: 'Hashing', attempted: 1, clean: 1 }]`.
  18. `weeklyStats counts the last 7 days and the clean streak`: clean finishes today, yesterday and 3 days ago, plus a hinted finish today, an unsolved finish 2 days ago and a clean finish 9 days ago → `{ solved: 4, clean: 3, unsolved: 1, streakDays: 2 }`.
  19. `the streak counts back from yesterday when today has no clean solve`.
  20. `coerceState repairs storage values`:
      - `undefined` → `createEmptyState()`.
      - A record missing `attempts` or with a bad `platform` → dropped.
      - `activeKey` pointing at a missing record → `null`.
      - A valid record survives unchanged.
  21. `trimState caps attempts at 50 per problem and problems at 2000, dropping the stalest first`.
  22. `activeTimeMs adds the live gap only when live and within 2 minutes`.
  23. `setApproach stores the note on the open attempt only`.
- [ ] **Step 2: Run and confirm they fail.** `node --test tests/practice-model.test.mjs` → FAIL.
- [ ] **Step 3: Implement `model.ts`.** `visit` and `heartbeat` call `normalize` first. `finishAttempt` on a record with no open attempt finishes a synthetic zero-length attempt (the user logged from the popup after the stale close). `coerceState` validates field types one by one and never throws.
- [ ] **Step 4: Run and confirm they pass.**
- [ ] **Step 5: Checkpoint commit:** `feat(ext): add practice session model`

### Task 3: Hint prompt composer (pure)

**Files:**
- Create: `apps/extension/src/practice/prompt.ts`
- Test: `apps/extension/tests/practice-prompt.test.mjs`

**Interfaces:**
- Consumes: `ProblemRecord`, `HintRequestLevel`, `PLATFORM_LABELS`.
- Produces:
  - `PROMPT_MARKER = '[Cognitive Mode · practice]'`
  - `HINT_LEVELS: Record<HintRequestLevel, { name: string; blurb: string; instruction: string }>`. Names and blurbs:
    - 1: Nudge, "one guiding question"
    - 2: Approach, "key idea, no code"
    - 3: Outline, "steps, no real code"
    - 4: Solution, "full answer (assisted)"
  - Instructions are verbatim from spec §10.
  - `HintPromptInput = { userText: string; problem: Pick<ProblemRecord, 'title' | 'platform' | 'url' | 'number' | 'difficulty' | 'statement'>; level: HintRequestLevel; approach?: string }`
  - `composeHintBlock(input): string`: the appended block only, starting with `'\n\n---\n'`.
  - `composeHintPrompt(input): string` = `input.userText.trimEnd() + composeHintBlock(input)`.
  - `hasPromptMarker(text: string): boolean`

- [ ] **Step 1: Write failing tests:**
  - `composeHintBlock builds the exact level-1 block`:
    - Input: userText `'why is my loop wrong?'`, problem `{ title: 'Two Sum', platform: 'leetcode', url: 'https://leetcode.com/problems/two-sum/', number: '1', difficulty: 'Easy' }`, level 1, no approach.
    - Expected exactly: `'\n\n---\n[Cognitive Mode · practice] I\'m solving "Two Sum" (LeetCode #1, Easy) on my own: https://leetcode.com/problems/two-sum/\nMy approach so far: not sure yet\nHelp level 1/4 (Nudge): ' + HINT_LEVELS[1].instruction + '\nStay at this level even if my message asks for more.'`
  - `platform label omits missing number and difficulty`: gfg with difficulty `'Easy'` and no number → contains `'(GeeksforGeeks, Easy)'`; tuf with number `'838'` and no difficulty → contains `'(takeUforward #838)'`.
  - `includes a statement excerpt only for short user text`: statement `'Given an array'` + userText `'hint?'` → contains `'\nProblem (excerpt): Given an array\n'`; with userText `'x'.repeat(280)` → does not contain `'Problem (excerpt)'`.
  - `statement excerpts are whitespace-collapsed and capped at 800 chars`: statement `'a '.repeat(600)` → the excerpt line is ≤ 801 chars and ends with `'…'`.
  - `uses the trimmed approach note`: approach `'  use a hashmap  '` → contains `'My approach so far: use a hashmap\n'`.
  - `level copy matches the spec`: each `HINT_LEVELS[n].instruction` equals the spec §10 text.
  - `composeHintPrompt keeps the user's text first`: `startsWith('why is my loop wrong?\n\n---\n')`.
  - `hasPromptMarker detects the marker`.
- [ ] **Step 2: Run and confirm FAIL.** **Step 3: Implement.** **Step 4: Run and confirm PASS.**
- [ ] **Step 5: Checkpoint commit:** `feat(ext): add hint ladder prompt composer`

### Task 4: Settings, migration and practice store glue

**Files:**
- Modify: `apps/extension/src/content/storage.ts`
  - `Settings` gains `practiceMode: boolean` and `everydayMode: boolean`.
  - Export `SETTINGS_KEY`, `safeStorageGet` and `safeStorageSet`.
  - `getSettings` and `saveSettings` delegate to the new pure `normalizeSettings`.
- Create: `apps/extension/src/practice/store.ts`
- Test: modify `apps/extension/tests/self-solved-stats.test.mjs` (it already transpiles `storage.ts`); create `apps/extension/tests/practice-store.test.mjs`

**Interfaces:**
- Produces, in `storage.ts`:
  - `normalizeSettings(value: unknown): Settings`. Defaults `{ countdownDuration: 15, enabled: true, practiceMode: true, everydayMode: false }`; the countdown is clamped to 5–60.
  - `migrateSettingsOnUpdate(stored: { cognitive_settings?: unknown; cognitive_entries?: unknown }): Settings | null`
- Produces, in `store.ts`:
  - `PRACTICE_STATE_KEY = 'cm_practice_v1'`
  - `readPracticeState(now?: number): Promise<PracticeState>`: coerce + normalize; does not write.
  - `updatePracticeState(update: (state: PracticeState, now: number) => PracticeState): Promise<PracticeState>`: per-tab promise chain; read → coerce → normalize → update → trim → write.
  - `onPracticeStateChange(listener: (state: PracticeState) => void): () => void`
- Import `storage.ts` from `store.ts` as `'../content/storage.ts'`. Its `import type` lines are erased under type stripping.

- [ ] **Step 1: Write failing tests:**
  - `normalizeSettings applies practice defaults`:
    - `undefined` → `{ countdownDuration: 15, enabled: true, practiceMode: true, everydayMode: false }`.
    - `{ countdownDuration: 99, enabled: false, everydayMode: true }` → `{ countdownDuration: 60, enabled: false, practiceMode: true, everydayMode: true }`.
  - `migration keeps Everyday mode for existing users`:
    - `{ cognitive_settings: { enabled: true, countdownDuration: 20 } }` → `{ countdownDuration: 20, enabled: true, practiceMode: true, everydayMode: true }`.
    - `{ cognitive_entries: [{}] }` → `everydayMode: true`.
    - `{ cognitive_settings: { enabled: false } }` → `everydayMode: false`.
  - `migration is a no-op for fresh profiles and already-migrated settings`:
    - `{}` → `null`.
    - `{ cognitive_settings: { everydayMode: false } }` → `null`.
  - `practice-store.test.mjs` installs an in-memory `globalThis.chrome = { storage: { local: { get, set }, onChanged: { addListener, removeListener } } }` before a dynamic import of `'../src/practice/store.ts'`. Tests:
    - `readPracticeState returns an empty state for empty storage`.
    - `updatePracticeState serializes concurrent updates in one tab`: two concurrent updates that each `visit` a different problem → both records persist.
    - `updatePracticeState writes the normalized, trimmed state`.
- [ ] **Step 2: Run and confirm FAIL.** **Step 3: Implement.** **Step 4: Run all extension tests and confirm PASS:** `npm test`.
- [ ] **Step 5: Checkpoint commit:** `feat(ext): add practice settings, migration and storage helpers`

### Task 5: Manifest, AI chat selectors and composer insertion

**Files:**
- Modify: `apps/extension/manifest.json` and `apps/extension/package.json`
  - version `0.3.0`; permissions `["storage", "alarms"]`;
  - `host_permissions` = AI hosts + practice hosts (Global Constraints);
  - `content_scripts[0].matches` = host_permissions + `https://cognitivemode.app/*` + `http://localhost/*`;
  - `web_accessible_resources[0].matches` = host_permissions;
  - description `"Practice coding problems with AI hints, not answers. Tracks clean solves and brings problems back for a re-solve."`
- Modify: `apps/extension/src/content/interceptor.ts`
- Create: `apps/extension/src/content/composer.ts`
- Modify: `apps/extension/src/content/types.ts`
- Test: modify `apps/extension/tests/platform-config.test.mjs`

**Interfaces:**
- Produces:
  - `PendingSubmit` gains `getText(): string`.
  - `export const platformSelectors` and `export function resolvePlatform(hostname: string): PlatformSelectors | null`.
  - `initInterceptor(onIntercept, options: { shouldIntercept: () => boolean }): InterceptorHandle`. Both handlers return early when `!options.shouldIntercept()`.
  - In `composer.ts`:
    - `getComposerText(input: HTMLElement): string` (moved from the interceptor);
    - `appendToComposer(input: HTMLElement, text: string): Promise<boolean>`: true only if the editor text contains `PROMPT_MARKER` afterwards. Insertion order follows spec §10.
- Selectors (Appendix A):

  | Host key | input | button |
  |---|---|---|
  | `chatgpt.com` | `form div.ProseMirror[contenteditable="true"], #prompt-textarea` | `button[data-testid="send-button"], form button[type="submit"][aria-label="Send" i], button[aria-label="Send prompt" i]` |
  | `claude.ai` | unchanged | `button[aria-label="Send message" i]` |
  | `chat.deepseek.com` (new) | `textarea[placeholder*="DeepSeek" i], textarea#chat-input` | `div[role="button"].ds-button--primary, button[aria-label*="send" i]` |
  | `v0.app` / `v0.dev` | v0.dev's existing selectors for both | |

  Remove `cursor.com` and `windsurf.com`.

- [ ] **Step 1: Update tests first.** They import `'../src/content/interceptor.ts'` directly.
  - `manifest host permissions are the AI and practice hosts`: exact 12-entry array, in the Global Constraints order.
  - `content scripts also cover the landing page`, and `web-accessible resources match host permissions`.
  - `manifest is version 0.3.0 with storage and alarms only`.
  - `selectors target the current ChatGPT composer`: `platformSelectors['chatgpt.com'].input` includes `'div.ProseMirror[contenteditable="true"]'`, and `.button` includes `'button[type="submit"][aria-label="Send" i]'`.
  - `Claude send button match is case-insensitive`: includes `'aria-label="Send message" i'`.
  - `DeepSeek is supported and desktop-IDE sites are not`: `resolvePlatform('chat.deepseek.com')` is not null; `resolvePlatform('cursor.com') === null`; `resolvePlatform('v0.app')` is not null.
  - Delete the old Cursor/Windsurf/v0.dev-only assertions. Keep the unlock, escape-trap and uninstall tests.
- [ ] **Step 2: Run and confirm FAIL.** **Step 3: Implement.** **Step 4: Run `npm test && npm run lint && npm run build` and confirm all pass.**
- [ ] **Step 5: Checkpoint commit:** `fix(ext): target current ChatGPT/Claude composers, add DeepSeek and practice hosts`

### Task 6: Hint ladder overlay and AI-tab routing

**Files:**
- Create: `apps/extension/src/content/hintSend.ts` (pure, dependency-injected), `apps/extension/src/content/HintLadder.tsx`
- Modify: `apps/extension/src/content/mount.tsx`, `apps/extension/src/content/index.tsx`, `apps/extension/src/content/types.ts`
- Test: `apps/extension/tests/hint-send.test.mjs`; add source assertions to `platform-config.test.mjs`

**Interfaces:**
- Consumes: `composeHintBlock` and `composeHintPrompt` (Task 3); `activePractice`, `recordHint` and `setApproach` (Task 2); `readPracticeState`, `updatePracticeState` and `onPracticeStateChange` (Task 4); `appendToComposer` (Task 5).
- Produces, in `hintSend.ts`:
  - `HintSendDeps = { append(text: string): Promise<boolean>; copy(text: string): Promise<boolean>; record(level: HintRequestLevel, approach: string): Promise<void>; send(): void; release(): void }`
  - `sendWithHint(deps, input: HintPromptInput): Promise<'sent' | 'copied' | 'failed'>`
  - `sendAsIs(deps): void`
- Produces, in `types.ts`: `OverlayView = { mode: 'everyday' } | { mode: 'practice'; problem: ProblemRecord }`. `OverlayController.show(pending, view)`.
- `mountOverlay` options gain `onSendWithHint(level, approach): Promise<'sent' | 'copied' | 'failed'>` and `onSendAsIs(): void`.
- AI-tab mode, decided synchronously from cached settings and practice state, both kept fresh via `chrome.storage.onChanged`:
  - `!enabled` → none;
  - `practiceMode && activePractice(state, Date.now())` → practice;
  - `everydayMode` → everyday;
  - otherwise none.
- `shouldIntercept = () => mode() !== null`.

- [ ] **Step 1: Write failing tests** with fake deps that record calls:
  - `sendWithHint appends the block, records the hint, then sends`: `append` resolves `true` → the call order is `['append', 'record', 'send']`; result `'sent'`; `append` received `composeHintBlock(input)`.
  - `sendWithHint never sends when insertion fails` (Review Focus 1): `append` resolves `false` and `copy` resolves `true` → order `['append', 'copy', 'release']`; `copy` received `composeHintPrompt(input)`; result `'copied'`. If `copy` also fails → `'failed'`, `send` still not called.
  - `sendAsIs sends without recording` (Review Focus 2): order `['send']`.
  - Source assertion `hint ladder has no timers or minimum lengths`: `HintLadder.tsx` source `doesNotMatch(/setInterval|setTimeout\(|MIN_CHARS|countdown/i)`, and it matches `/'Escape'/`.
- [ ] **Step 2: Run and confirm FAIL.** **Step 3: Implement.**
  - **`HintLadder.tsx` (spec §10 layout):**
    - Keys `1`–`4` select a level, `Enter` sends (Shift+Enter inserts a newline in the note), `Esc` dismisses. No escape trap.
    - The default level is `max(1, currentAttempt.maxHintLevel)`.
    - The approach note is prefilled from `currentAttempt.approach` and saved via `setApproach` on send.
    - On `'copied'` or `'failed'`, show the inline message from spec §10 step 3 and keep the overlay open.
  - **`index.tsx`:**
    - Route by host: `isPracticeHost` → `initPracticeRuntime()` (Task 7; import it now, and stub its module with a no-op until Task 7); `resolvePlatform` → AI flow; landing → handshake.
    - The "send" dep waits two animation frames, then calls `interceptor.unlock(pending.trigger)`.
  - **Everyday mode** keeps using `FrictionOverlay` and its existing callbacks unchanged.
- [ ] **Step 4: Run `npm test && npm run lint && npm run build` and confirm all pass.**
- [ ] **Step 5: Checkpoint commit:** `feat(ext): add hint ladder overlay for practice sessions`

### Task 7: Practice-site runtime and pill

**Files:**
- Create: `apps/extension/src/practice/extract.ts` (DOM glue), `apps/extension/src/practice/PracticePill.tsx`, `apps/extension/src/practice/mountPill.tsx`, `apps/extension/src/practice/runtime.ts`
- Modify: `apps/extension/src/content/content.css` (pill styles, if any beyond Tailwind)
- Test: add to `apps/extension/tests/practice-platforms.test.mjs` only for any new pure helper. The DOM glue is verified live in Task 10.

**Interfaces:**
- Consumes: Task 1 parsers; `visit`, `heartbeat`, `recordSubmit`, `finishAttempt`, `deriveOutcome`, `currentAttempt` and `activeTimeMs` (Task 2); store (Task 4); `normalizeSettings`/`getSettings` (Task 4).
- Produces:
  - `extractProblem(href: string, doc: Document): { ref: ProblemRef; statement?: string } | null`
  - `isSubmitClick(platform: Platform, target: EventTarget | null): boolean`
  - `initPracticeRuntime(): () => void`
  - `mountPill(): { update(props: PracticePillProps): void; destroy(): void }`
- Extraction order (spec §11):
  - URL → `parseProblemUrl`;
  - then `__NEXT_DATA__` via the Task 1 parsers (LeetCode only when the slug matches);
  - then the DOM selectors in spec §11;
  - then `titleFromSlug(slug)` as the last resort.
  - Statement: the platform container's `innerText`, or `contentHtml` rendered through `new DOMParser()` → `textContent`. Collapse whitespace and cap at 1500 chars.
- Runtime:
  - Poll `location.href` every 1000 ms and listen to `popstate`. **Do not patch `history`**: content scripts run in an isolated world and can't see the page's `pushState` calls.
  - On a problem URL: retry `extractProblem` every 1 s for up to 10 s, until a non-slug title is found; then `updatePracticeState(visit)` and mount the pill.
  - On leaving a problem URL: unmount the pill.
  - Heartbeat every 60 s while `document.visibilityState === 'visible'`, and on `visibilitychange` to visible.
  - Capture-phase `click` listener: `isSubmitClick` → `recordSubmit`, then auto-open the log panel 4 s later.
  - Respect the settings: no pill or tracking unless `enabled && practiceMode`, re-checked on settings change.
- Pill (spec §11 copy):
  - Shows active time as `mm:ss`, ticking each second while visible.
  - Hint summary: none → "no hints yet"; 1–2 → "used a hint"; 3–4 → "saw the solution".
  - Log panel options: Solved clean / Solved with hints / Needed the solution / Didn't solve / Not now. The first three map to `clean`, `hinted` and `assisted`, with `deriveOutcome` pre-selected.
  - After logging, show "Logged · back in 3 days for a clean re-solve" when a review was scheduled, else "Logged".
  - Collapse-to-dot state is stored in `chrome.storage.local` under `cm_pill_collapsed` as `{ [platform]: boolean }`.

- [ ] **Step 1: Implement extract, pill, mount and runtime.**
- [ ] **Step 2: Run `npm test && npm run lint && npm run build` and confirm all pass.**
- [ ] **Step 3: Checkpoint commit:** `feat(ext): track practice sessions on LeetCode, GFG and takeuforward`

### Task 8: Background (migration, badge, hourly normalize)

**Files:**
- Modify: `apps/extension/src/background.ts`
- Test: add to `apps/extension/tests/platform-config.test.mjs`

**Interfaces:**
- Consumes: `migrateSettingsOnUpdate`, `SETTINGS_KEY` (Task 4); `updatePracticeState`, `PRACTICE_STATE_KEY` (Task 4); `dueProblems` (Task 2).
- Behavior:
  - `onInstalled`: `install` → open the welcome tab (existing). `update` → read `cognitive_settings` and `cognitive_entries`, and write `migrateSettingsOnUpdate(...)` if it isn't null.
  - `refreshBadge()`: run `updatePracticeState(identity)` (normalizes and persists), then `setBadgeText({ text: due ? String(due) : '' })` and `setBadgeBackgroundColor({ color: '#10b981' })`.
  - Call it on `onStartup`, `onInstalled`, `storage.onChanged` for `cm_practice_v1`, and the `cm-hourly` alarm (`chrome.alarms.create('cm-hourly', { periodInMinutes: 60 })`).
  - Guard against loops: `refreshBadge` must not write when normalize changed nothing, i.e. compare the JSON before and after.
  - The uninstall URL is unchanged.

- [ ] **Step 1: Add source assertions**:
  - `background migrates settings on update`: matches `/migrateSettingsOnUpdate/`.
  - `background keeps a due-count badge`: matches `/setBadgeText/` and `/periodInMinutes:\s*60/`.
  - The existing uninstall-URL test stays green.
- [ ] **Step 2: Implement.** The `updatePracticeState` write-skip goes in `store.ts`; add a test there: `updatePracticeState skips the write when nothing changed`.
- [ ] **Step 3: Run `npm test && npm run lint && npm run build` and confirm all pass.**
- [ ] **Step 4: Checkpoint commit:** `feat(ext): badge due re-solves and migrate settings on update`

### Task 9: Popup and dashboard

**Files:**
- Modify: `apps/extension/src/App.tsx`, `apps/extension/src/App.css`, `apps/extension/src/History.tsx`, `apps/extension/src/History.css`, `apps/extension/history.html` (`<title>Dashboard · Cognitive Mode</title>`)
- Test: replace the popup source assertions in `apps/extension/tests/platform-config.test.mjs`

**Interfaces:**
- Consumes: the store and every Task 2 query; `normalizeSettings`, `saveSettings`; `getCognitiveLogs` (legacy Notes tab).
- **Popup (360 × 560):** spec §13 sections in order.
  - Header toggle: Active/Paused (`enabled`).
  - "Now practicing" card when `activePractice`: same log options as the pill, calling `finishAttempt`.
  - "Re-solve today": each item links to `record.url` via `chrome.tabs.create`.
  - This week: `weeklyStats`. Top topics: the first 4 of `topicReadiness`, with bar width `clean / attempted`.
  - Settings disclosure:
    - Practice mode toggle;
    - Everyday mode toggle;
    - the delay slider, shown only when Everyday mode is on.
  - "Share my week" opens an X intent with `I solved ${clean}/${solved} practice problems clean this week, ${streakDays}-day streak. Practicing DSA with AI hints, not answers: cognitivemode.app`.
  - "Open dashboard" opens `history.html`.
- **Dashboard tabs:**
  - Practice log: searchable table with problem link, platform, difficulty, outcome, hints, active time, date.
  - Re-solve: due and upcoming.
  - Topics: all bars.
  - Notes: the legacy Knowledge Base list and search, moved unchanged.

- [ ] **Step 1: Update source assertions:**
  - The popup uses `dueProblems`, `weeklyStats` and `topicReadiness`, and contains `'Re-solve today'` and `'Everyday mode'`.
  - The popup CSS height is `560px`.
  - The dashboard contains the tab labels `'Practice log'`, `'Re-solve'`, `'Topics'` and `'Notes'`.
  - Remove the old self-solved popup assertions.
- [ ] **Step 2: Implement.** **Step 3: Run `npm test && npm run lint && npm run build` and confirm all pass.**
- [ ] **Step 4: Checkpoint commit:** `feat(ext): practice dashboard in popup and full page`

### Task 10: Live end-to-end verification (owner's Chrome)

Needs the owner to: (a) disable the store copy of Cognitive Mode, and (b) "Load unpacked" `apps/extension/dist`. Ask once, just in time. Sending real prompts needs a separate explicit OK.

- [ ] **Step 1: `npm run build` and ask the owner to load `apps/extension/dist`.**
- [ ] **Step 2: Practice pages.** On LeetCode `two-sum`, GFG `key-pair5616/1` and TUF `linear-search`:
  - The pill shows the right title and difficulty.
  - The timer ticks.
  - Clicking Submit while logged out opens the log panel after about 4 s.
  - LeetCode "next problem" navigation switches the pill to the new problem.
  - Screenshot each page.
- [ ] **Step 3: Hint ladder.** On ChatGPT, Claude, Gemini, Perplexity and DeepSeek, with a problem active:
  - Type `test`, press Enter → the ladder appears.
  - Esc closes it with nothing sent; clear the text.
  - Then, only with the owner's OK, send one level-1 prompt per AI and confirm the block shows up in the sent message. If insertion fails on any site, confirm the copy fallback message appears and nothing is sent, and record the site in the risks.
- [ ] **Step 4: Everyday mode.** Toggle it on with no active practice → the legacy gate appears on ChatGPT. Toggle it off → no interception.
- [ ] **Step 5: Popup and dashboard.** Log the outcomes, then check the due list, stats and topics. Screenshot them for the store listing.
- [ ] **Step 6: Fix anything found** (with a failing test first wherever the cause is in pure code), rebuild, and re-check.

### Task 11: Website landing page

**Files:**
- Modify: `apps/web/app/page.tsx`, `apps/web/app/layout.tsx`, `apps/web/app/components/FeatureGrid.tsx`, `apps/web/app/components/Footer.tsx`
- Create: `apps/web/app/components/HintLadderDemo.tsx`, `apps/web/app/components/HowItWorks.tsx`, `apps/web/app/components/Faq.tsx`, `apps/web/app/components/Comparison.tsx`, `apps/web/app/opengraph-image.tsx`
- Delete: `apps/web/app/components/ExtensionSimulator.tsx`, `apps/web/public/og-image.png`, `apps/web/public/og-image.svg`
- Test: modify `apps/web/tests/public-readiness.test.mjs` (and the other web tests if their assertions reference removed copy)

**Interfaces:**
- Keep the extension-presence handshake (`cognitivemode-extension` meta and the `cognitivemode:ready` event) and the store URL.
- Hero H1 `Practice DSA with AI, without cheating yourself.` Subcopy: "Cognitive Mode turns ChatGPT, Claude and Gemini into a hint ladder while you solve LeetCode, GeeksforGeeks and takeuforward problems, then brings back the ones you needed help on. Free. No API key. Nothing leaves your browser."
- `HintLadderDemo`: a client component replicating the overlay and pill visuals on a fake LeetCode + ChatGPT frame. Clicking a level shows a canned AI reply for that level. No network.
- `Faq`:
  - Renders the Q&As in spec §14.
  - Emits `FAQPage` JSON-LD through a native `<script type="application/ld+json">` with `<` escaped as `<` (Next 16 JSON-LD guide).
  - Also apply the same escaping to the existing `SoftwareApplication` JSON-LD in `layout.tsx`.
- `opengraph-image.tsx`: `ImageResponse` from `next/og`, 1200×630, `export const alt`, `size` and `contentType = 'image/png'`. Remove the static `openGraph.images` and `twitter.images` entries so the file convention supplies them.
- Metadata title `Cognitive Mode | Practice DSA with AI hints, not answers`; matching description. `FeatureGrid` is rewritten to the practice mechanisms (hint ladder, re-solve queue, local-first). Footer tagline: `Practice with AI. Think for yourself.`

- [ ] **Step 1: Update tests first:**
  - The OG test now asserts `app/opengraph-image.tsx` exists and exports `size = { width: 1200, height: 630 }`.
  - `layout.tsx` JSON-LD uses `.replace(/</g, '\\u003c')`.
  - `page.tsx` contains the new H1 and renders `<Faq`.
  - `Faq.tsx` contains `"@type": "FAQPage"`.
  - Remove any assertion on deleted copy.
- [ ] **Step 2: Run `npm test` in `apps/web` and confirm FAIL.** **Step 3: Implement.** **Step 4: Run `npm test && npm run lint && npm run build` and confirm all pass.**
- [ ] **Step 5: Run `npm run dev` and check `/` in Chrome at 1440 px and 390 px widths.** No horizontal scroll; the demo works by keyboard and mouse; screenshot.
- [ ] **Step 6: Checkpoint commit:** `feat(web): rewrite landing page for practice mode`

### Task 12: Secondary pages, docs and store listing

**Files:**
- Modify:
  - `apps/web/app/welcome/page.tsx`: steps are Pin → Open a problem on LeetCode/GFG/takeuforward → Ask your AI and pick a hint level.
  - `apps/web/app/privacy/page.tsx`: list exactly what's stored locally (`cm_practice_v1` fields in plain words, settings, legacy notes); no network, no analytics.
  - `apps/web/app/goodbye/GoodbyeFeedbackForm.tsx`: the reasons become "Didn't work on my practice site", "Hint ladder got in the way", "Buggy", "Missing a feature".
  - `README.md`, `apps/extension/README.md` (supported surfaces, Node ≥ 22.18 for tests), `apps/web/README.md`.
- Create: `docs/store-listing.md`, containing:
  - Title `Cognitive Mode: AI hints for DSA practice`;
  - a ≤ 132-char summary;
  - the full description;
  - category `Education`;
  - a single-purpose statement;
  - per-host permission justifications plus `alarms`;
  - a screenshot shot-list mapped to the Task 10 screenshots;
  - release notes mentioning that existing users must re-enable the extension after the permission prompt.
- Test: update `apps/web/tests/goodbye-page.test.mjs` and `public-readiness.test.mjs` assertions for the new copy.

- [ ] **Step 1: Update tests, then implement.** **Step 2: Run web and extension `npm test && npm run lint && npm run build`; all pass.**
- [ ] **Step 3: Checkpoint commit:** `docs: practice mode pages, READMEs and store listing`

### Task 13: Final verification, packaging, whole-branch review

- [ ] **Step 1:** From the repo root, run `npm test -w apps/extension && npm run lint -w apps/extension && npm run package:ext && npm test -w apps/web && npm run lint -w apps/web && npm run build:web`. All green; `apps/extension/cognitivemode-release.zip` is rebuilt.
- [ ] **Step 2:** Dispatch one fresh reviewer subagent on the whole branch diff against `master`, with the spec, this plan and the Review Focus list. Fix the confirmed findings and re-run Step 1.
- [ ] **Step 3:** `git diff --stat master` review: no debug code, no stray files, no `dist/` or zip tracked.
- [ ] **Step 4:** Hand-off to the owner:
  - the store listing upload (zip, copy, screenshots);
  - the Vercel deploy of `apps/web`, which needs the owner's OK to push or merge;
  - the Product Hunt relaunch timing;
  - the 6-week kill check.
