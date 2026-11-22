# Cognitive Mode: Practice Mode (pivot) design

Date: 2026-11-22 · Status: approved (the owner delegated all product and design calls) · Branch: `feat/practice-mode`

## 1. Intent

Cognitive Mode becomes **"practice with AI without cheating yourself"**: a free, local-only Chrome extension for people practicing DSA and coding-interview problems.

Why we are pivoting (evidence gathered 2026-11-22):

- About 5.5 months after launch, weekly usage of the extension stayed very low.
- The whole "pause before you prompt" niche, about 12 extensions, has **fewer than 100 users combined**. The best of them, pause.do, has 45 despite a Product Hunt launch and a paid tier. Makers like the idea; users don't keep a tool that only slows them down.
- LeetCode practice tools pull an order of magnitude more users (LeetSRS 690, LeetRecur 637, Leetcode Buddy 392, LeetCode Assistant 215).
- The pain is sharp and has a deadline. Online assessments and interview DSA rounds are AI-free, and people who practice with ChatGPT open freeze there.
- Our wedge: competitors either live on leetcode.com or block AI entirely. The shortcut actually happens in the ChatGPT tab, which is where our interceptor already runs. We turn the user's **own** AI into a hint ladder, so there is no API key, no server and no cost.

Learning-science basis: attempting a problem before being told the answer (the generation and pretesting effects) and spaced retrieval improve retention. Anthropic's Jan 2026 RCT found AI-assisted learners scored 17% lower on comprehension, but learners who used AI for conceptual questions retained more. The hint ladder steers usage toward that pattern.

## 2. Goals

1. While a practice problem is open, sending a prompt to a supported AI chat offers a **4-level hint ladder**. The chosen level is enforced by an instruction appended to the user's own prompt.
2. Each problem attempt ends with an outcome (**Clean / Hinted / Assisted**). An accepted submission pre-fills it, so logging costs about one click.
3. A **re-solve queue**: problems that needed help come back after 3, 7 and 21 days. The toolbar badge shows how many are due.
4. **Readiness by topic** (clean rate per topic), weekly stats and a clean-solve streak.
5. Fix today's broken interception: ChatGPT's composer changed and Claude's send-button label changed.
6. Rewrite the website and store copy around the new promise, with an FAQ written to be cited by answer engines (AEO).
7. Zero running cost: no backend, no accounts, no API keys, nothing leaves the browser.

## 3. Non-goals (v1)

- No AI calls of our own: no API, no on-device model, no static hint content.
- No sync, accounts or cloud.
- No Codeforces, Code360, HackerRank or InterviewBit adapters (v2 candidates).
- No guessing whether a prompt is "about the problem". The overlay has a one-click "send as is" instead.
- No image share cards; share text only.
- No i18n, no Firefox build.

## 4. Anti-goals (failure even if it "works")

- **Practice mode becoming friction again.** No timers, no mandatory text, no minimum character counts. The most a prompt can cost is one keypress (choosing a level), and Esc always gets the user out.
- Shaming copy ("you cheated"). The tone is a coach, not a cop.
- Any network request carrying user data.
- Blocking the user when our selectors break. On any failure, fall back to letting the original send go through.

## 5. Constraints

- Manifest V3; content scripts run in an isolated world but share the DOM.
- Event handlers must call `preventDefault` synchronously, so the content script keeps an **in-memory cache** of the state it needs, kept fresh with `chrome.storage.onChanged`.
- AI chat UIs change often. Selectors need fallback lists and are pinned by tests.
- New host permissions on update make Chrome disable the extension until the user re-approves. We accept this: about 7 users, and the release notes will say so.
- Chrome Web Store single-purpose policy. The stated purpose is "use AI to practice and learn without outsourcing your thinking", which covers both modes.
- Free, and no running cost for the owner.

## 6. Approaches considered

**Where hints come from:**

| Option | Trade-off | Decision |
|---|---|---|
| A. The user's own AI chat. We append a level instruction to their prompt | Zero cost, no setup, works on free tiers. Relies on the model following instructions, which it does well for this | **Picked** |
| B. Bring your own API key | Students won't create keys, and it needs key storage and an in-extension chat UI | Rejected |
| C. On-device Gemini Nano (Chrome built-in AI) | Free, but needs capable hardware and is weak at algorithmic reasoning | Rejected for v1; maybe later for classification |
| D. Static curated hint ladders for popular lists | Highest quality, but a big content job with limited coverage | Rejected for v1 |

**How outcomes are recorded:** manual buttons are the reliable path. Accepted-verdict detection (watched only after the user clicks Submit) pre-fills the outcome. Picked: both, with manual as the source of truth.

**Code layout:** keep the single content bundle with host routing (`index.tsx` already routes by host) rather than adding a second bundle and vite mode. Picked: single bundle, new modules.

## 7. Decisions made by the builder (owner delegated)

- Same extension ID, name, store listing and domain. Version goes to **0.3.0**.
- AI chats: ChatGPT, Claude, Gemini, Perplexity, **DeepSeek (new)**, v0 (**v0.app** added next to v0.dev), Bolt.
  - **Removed: cursor.com and windsurf.com.** Their AI runs in desktop IDEs, so those content scripts never did anything useful.
- Practice platforms for v1: **LeetCode** (`/problems/<slug>`), **GeeksforGeeks** (`/problems/<slug>/<n>`), **takeuforward** (`/practice/dsa/<slug>`).
- The old hypothesis gate becomes **Everyday mode**: off for new installs; on for existing users who had the extension active, so nothing changes silently. Its behavior stays as it is today.
- The global Active/Paused toggle stays and pauses everything.
- Re-solve intervals are fixed at 3, 7 and 21 days. FSRS is overkill for this.

## 8. Architecture

```
practice site tab (LeetCode / GFG / TUF)          AI chat tab (ChatGPT / Claude / ...)
┌───────────────────────────────┐                ┌──────────────────────────────────┐
│ content.js → practice router  │                │ content.js → AI router            │
│  • platform adapter: URL→ref, │   chrome.      │  • interceptor (Enter + send click)│
│    page→title/diff/topics/    │   storage      │  • sync gate: cached state says   │
│    statement excerpt          │◄──.local──────►│    practice-active / everyday / off│
│  • visit + heartbeat (60s)    │                │  • HintLadder overlay (practice)  │
│  • Practice pill (shadow DOM) │                │  • FrictionOverlay (everyday)     │
│  • verdict watcher            │                │  • prompt composer + editor insert│
└───────────────────────────────┘                └──────────────────────────────────┘
                 ▲                                              ▲
                 │            background.js (service worker)    │
                 │  onInstalled: welcome tab / migration;       │
                 └─ alarms + storage.onChanged → badge = due ───┘
popup.html (practice dashboard) · history.html (full dashboard: log, re-solve, topics, notes)
```

- Content scripts read and write `chrome.storage.local` directly; there is no message passing. Every writer is single-key and idempotent, as defined below.
- Pure domain logic (`src/practice/model.ts`, `src/practice/prompt.ts`, `src/practice/platforms.ts`) has no `chrome.*` or DOM access, so it can be unit-tested with `node --test` the way the existing tests transpile TS.

## 9. Data model

Storage key `cm_practice_v1`:

```ts
type Platform = 'leetcode' | 'gfg' | 'tuf'
type Outcome = 'clean' | 'hinted' | 'assisted' | 'unsolved'
type HintLevel = 0 | 1 | 2 | 3 | 4

interface ProblemRef {
  platform: Platform
  slug: string            // stable id from the URL
  title: string
  url: string             // canonical problem URL
  difficulty?: string     // as shown by the platform (Easy, Medium, Hard, Basic, School)
  topics: string[]        // normalized topic names, may be empty (TUF)
}

interface Attempt {
  startedAt: number
  lastActiveAt: number
  activeMs: number        // time actually spent: sum of gaps ≤ 2 min between activity pings
  maxHintLevel: HintLevel
  hintRequests: number
  submits: number         // Submit-button clicks seen on the problem page
  outcome?: Outcome
  endedAt?: number
  autoClosed?: boolean    // closed by the stale rule, not by the user
}

interface ProblemRecord extends ProblemRef {
  key: string             // `${platform}:${slug}`
  statement?: string      // plain-text excerpt, ≤ 1500 chars, local only
  attempts: Attempt[]     // last element is the current/latest attempt
  review?: { stage: 1 | 2 | 3; dueAt: number }
  graduatedAt?: number
}

interface PracticeState {
  version: 1
  problems: Record<string, ProblemRecord>
  activeKey: string | null
}
```

**Rules (pure functions, all take `now`):**

- `ping(attempt, now)`: the shared activity update. If `now - lastActiveAt ≤ 2 min`, add the gap to `activeMs`. Always set `lastActiveAt = now`.
- `normalize(state, now)`: the stale rule, applied before every write and by the background's hourly alarm. For each record whose last attempt is unfinished and `now - lastActiveAt > 6 h`:
  - **Trivial** (`activeMs < 2 min`, no hints, no submits): drop the attempt. Drop the record too if it then has no attempts, no `review` and no `graduatedAt`. This covers people who only glanced at a problem.
  - **Otherwise**: close it with `outcome: 'unsolved'`, `autoClosed: true`, `endedAt = lastActiveAt`. If `maxHintLevel ≥ 1`, set `review = { stage: 1, dueAt: endedAt + 3d }`.
- `visit(state, ref, now)`: run `normalize`, then upsert the record and refresh its metadata.
  - Start a new attempt if there are no attempts, or the last attempt is finished and ended more than 30 minutes ago. Within 30 minutes, re-opening a just-solved problem (e.g. to look at submissions) doesn't start a new attempt.
  - Otherwise `ping` the unfinished last attempt.
  - Set `activeKey`.
- `heartbeat(state, key, now)`: `ping` the unfinished last attempt. Sent every 60 s while the problem tab is visible.
- `activePractice(state, now)`: returns the record if `activeKey` exists and its last attempt is unfinished with `now - lastActiveAt ≤ 90 min`, else null. After solving, AI use is free again.
- `recordHint(state, key, level, now)`: on the unfinished attempt, `ping`, `maxHintLevel = max(…)` and `hintRequests += 1`.
- `recordSubmit(state, key, now)`: on the unfinished attempt, `ping` and `submits += 1`.
- `deriveOutcome(maxHintLevel)`: 0 → clean, 1–2 → hinted, 3–4 → assisted. This is only the pre-selected suggestion; "Didn't solve" is always a separate, explicit choice.
- `finishAttempt(state, key, outcome, now)`: sets `outcome` and `endedAt`, then updates the review:
  - **hinted, assisted or unsolved** → `review = { stage: 1, dueAt: now + 3d }`. This resets an in-progress review.
  - **clean, with a review due** (`now ≥ dueAt − 12h`) → stage 1 → 2 (+7d), 2 → 3 (+21d), 3 → graduated (`review` cleared, `graduatedAt` set). The 12-hour window stops "solve it 5 minutes after reading the answer" from counting as a re-solve.
  - **clean, not yet due** → schedule unchanged.
- `dueProblems(state, now)`: review `dueAt ≤ end of local today`, sorted by `dueAt`.
- `topicReadiness(state)`: per topic, count problems with ≥1 finished attempt and how many have a clean **latest** outcome. Unsolved counts as attempted but not clean. Sorted by attempted count.
- `weeklyStats(state, now)`, over the last 7 days:
  - `solved`: finished attempts with outcome clean, hinted or assisted.
  - `clean`: the clean ones.
  - `unsolved`: the unsolved ones.
  - Clean streak: consecutive local days with ≥1 clean finish, counting back from today or yesterday.
- Timers everywhere (pill, popup, dashboard) show **active time** (`activeMs`, plus the live gap while the tab is visible), never wall-clock time since `startedAt`.
- Topic normalization: lowercase, trim, fold simple plurals, then apply a synonyms map (e.g. `hash`, `hash table`, `hashing` → `Hashing`; `array`, `arrays` → `Arrays`; `dp`, `dynamic programming` → `Dynamic Programming`), then title-case.
- Size cap: keep at most 50 attempts per problem and at most 2000 problems. Trim the oldest attempts first.

**Concurrency:** two tabs can write the same key (a heartbeat from the problem tab and recordHint from the AI tab). Each writer does read → pure update → write of the whole `cm_practice_v1` object. A lost update costs at most one heartbeat or one hint count. Updates go through one `updatePracticeState(fn)` helper that serializes writes *within* a tab with a promise chain; across tabs the race window is milliseconds and the effect is benign. The design accepts this rather than adding a lock.

**Settings** (`cognitive_settings`, extended): `{ countdownDuration, enabled, practiceMode: true, everydayMode: boolean }`.

**Migration** (background `onInstalled` with `reason === 'update'`): if `cognitive_settings.everydayMode` is undefined, set it to `enabled ?? true` **only when** `cognitive_entries` has at least one entry or `cognitive_settings` already existed. Otherwise false. Old keys (`cognitive_entries`, `cognitivemode_stats`, `cognitive_daily_bypass`) are left untouched and still read by Everyday mode and the Notes tab.

## 10. Hint ladder

**Overlay** (practice active, user pressed Enter or Send with non-empty text):

```
┌───────────────────────────────────────────────────────────┐
│ PRACTICE MODE                                      esc ✕  │
│ Two Sum · LeetCode · Easy · 12 min in                      │
│                                                           │
│ How much help do you want?                                │
│ ┌────────────┬────────────┬────────────┬────────────┐     │
│ │ 1 Nudge    │ 2 Approach │ 3 Outline  │ 4 Solution │     │
│ │ one guiding│ key idea,  │ steps, no  │ full answer│     │
│ │ question   │ no code    │ real code  │ (assisted) │     │
│ └────────────┴────────────┴────────────┴────────────┘     │
│ Your approach so far (optional, sent to the AI)           │
│ [____________________________________________________]    │
│                                                           │
│ Not about this problem? Send as is          [ Send ↵ ]    │
└───────────────────────────────────────────────────────────┘
```

- Keys: 1–4 select a level, Enter sends, Esc closes without sending. Esc is not trapped; that is Everyday mode's job.
- The default selection is the attempt's current `maxHintLevel`, or level 1 when it is 0. Escalating is explicit.
- The approach note is optional and kept per problem while the attempt is open.
- **"Send as is"** sends the original prompt unchanged and records nothing.

**Appended block** (after a blank line, at the end of the user's text):

```
---
[Cognitive Mode · practice] I'm solving "{title}" ({platformLabel}{, difficulty}) on my own: {url}
{statementBlock}
My approach so far: {approach | "not sure yet"}
Help level {n}/4 ({name}): {levelInstruction}
Stay at this level even if my message asks for more.
```

- `statementBlock`: `Problem (excerpt): {statement ≤ 800 chars}`, included only when the statement is known **and** the user's own text is under 280 characters (i.e. they didn't paste the problem).
- Level instructions:
  1. **Nudge**: "Reply with one short guiding question or observation that points me toward the key insight. No algorithm or data-structure names, no code, no complexity. If my approach is on the right track, say so in one line."
  2. **Approach**: "Explain the core idea of an efficient approach in 2–4 sentences: which data structure or technique and why it fits. No code or pseudocode; let me work out the details."
  3. **Outline**: "Give a short, language-agnostic step-by-step outline plus time and space complexity. No real code."
  4. **Solution**: "Give a complete solution with a brief explanation, then ask me one question to check that I understood the key step."

**Insertion into the composer** (`src/content/composer.ts`):

1. Textarea: native value setter plus a bubbling `input` event (works for React-controlled fields).
2. contenteditable (ProseMirror, Lexical, Quill): focus, put the caret at the end, and dispatch a synthetic `paste` `ClipboardEvent` with `text/plain` DataTransfer data. If the text doesn't appear, fall back to `document.execCommand('insertText')`.
3. Check that the editor text now contains the `[Cognitive Mode` marker. If not, copy the composed prompt to the clipboard and show "Couldn't add the hint level automatically. Copied: paste it and send". Don't auto-send in that case.
4. On success, wait two animation frames, then call the existing `trigger()` (re-resolves the send button; falls back to Enter).

## 11. Practice pages

**Platform adapters** (`src/practice/platforms.ts`, pure URL parsing, plus `src/practice/extract.ts` for DOM reads):

| Platform | Problem URL | Title / difficulty / topics | Statement | Submit button |
|---|---|---|---|---|
| LeetCode | `leetcode.com/problems/<slug>/…` | `__NEXT_DATA__` question, **only if its slug matches the URL** (SPA navigation leaves it stale), else DOM: `.text-title-large`/`[data-e2e-locator=question-title]`, difficulty chip text, `a[href^="/tag/"]` | `[data-track-load="description_content"]` text | `[data-e2e-locator="console-submit-button"]` |
| GeeksforGeeks | `geeksforgeeks.org/problems/<slug>/<n>` | `__NEXT_DATA__` `props.pageProps.initialState.problemData.allData.probData` (`problem_name`, `difficulty`, `tags.topic_tags`), else DOM: `h3`, "Difficulty: X" text, `a[href*="/explore?category"]` | problem statement container text | button whose text is "Submit" (class contains `submit_button`) |
| takeuforward | `takeuforward.org/practice/dsa/<slug>` | `h1` (strip the leading `838. `), difficulty badge text (Basic, Easy, Medium, Hard), topics `[]` | problem panel text | button whose text is "Submit" |

**Logging trigger (v1):** we don't parse verdicts. A click on the platform's Submit button (capture-phase listener) calls `recordSubmit`. About 4 s later the pill expands with "Submitted. How did it go?" and the derived outcome pre-selected. Reasons for skipping verdict parsing:

- Checking verdict DOM needs logged-in accounts and real submissions.
- A wrong verdict parse would silently mislabel outcomes.
- The user sees the verdict themselves anyway.

Verdict parsing is a v2 candidate.

**Extraction code shape:** each adapter splits into pure parsers that take strings or JSON (`parseLeetCodeNextData(json, slug)`, `parseGfgNextData(json, slug)`, `parseTitlePrefix(text)`, `parseDifficultyText(text)`, `normalizeTopics(names)`) and a thin DOM-glue layer that gathers those strings. The pure parsers are unit-tested with small hand-written inputs; the DOM glue is verified on the live pages. We deliberately add no HTML fixtures, so no copyrighted problem pages end up in the repo, and no jsdom/linkedom dependency.

- SPA handling: watch URL changes (patch `history.pushState`/`replaceState` events plus `popstate`, and poll `location.href` every 1s as a backstop) and re-run detection.
- Metadata can appear late. Retry the extraction for up to about 10s and upsert again once the title appears.

**Practice pill** (bottom-right, shadow DOM, same visual language as the overlay):

```
● Practicing · 12:34 · no hints yet            [ Log result ▾ ]
```

Expanded: "How did it go?" with **Solved clean · Solved with hints · Needed the solution · Didn't solve**, the derived one pre-selected among the first three, plus "Not now" (keeps the attempt open). After a Submit click, the pill expands by itself as described above. The pill can be collapsed to a dot and remembers that per platform.

## 12. Background

- `onInstalled`: on `install`, open `https://cognitivemode.app/welcome` (existing behavior). On `update`, run the migration.
- Badge: `chrome.action.setBadgeText` shows the due count (empty when 0), with an emerald background. Recompute on startup, on `storage.onChanged` for `cm_practice_v1`, and on an hourly `chrome.alarms` alarm, so the count rolls over at midnight. Adds the `alarms` permission, which shows no warning.
- The uninstall URL stays.

## 13. Popup (360 × 560) and dashboard

**Popup:**
1. Header with the Active/Paused toggle.
2. "Now practicing" card when a practice session is active: problem, timer, hints used, Log result.
3. "Re-solve today": the due list, linking to the problem URLs, with an "all caught up" empty state.
4. This week: clean solves, total solves, clean streak.
5. Top topics: up to 4 readiness bars.
6. Settings disclosure: Everyday mode toggle, plus the delay slider when it is on.
7. Link to the full dashboard.

**Dashboard** (`history.html`, kept as the file name): tabs **Practice log** (searchable table) · **Re-solve** (due and upcoming) · **Topics** (all bars) · **Notes** (the legacy Knowledge Base list and search).

## 14. Website (apps/web, Next 16)

- **Landing page:**
  - New hero: "Practice DSA with AI, without cheating yourself."
  - A "how it works" section in 4 steps.
  - An interactive hint-ladder demo that replaces the friction simulator.
  - Supported sites and AIs.
  - A privacy block.
  - An FAQ with `FAQPage` JSON-LD for AEO, covering: ChatGPT free tier, no API key, what data stays local, which sites, how it differs from LeetCode hints and Study Mode, whether it slows you down.
  - A comparison section: blocking AI vs Study Mode vs paid AI tutors vs Cognitive Mode.
- Welcome, privacy and goodbye pages rewritten for practice mode. Privacy lists exactly what is stored locally.
- Metadata, OG image (via `opengraph-image` in the app router) and JSON-LD updated. The sitemap keeps the same routes.

## 15. Store listing (owner uploads)

Write `docs/store-listing.md` with: title, summary (≤ 132 chars), description, category (Education), permission justifications per host, and a screenshot shot-list. The screenshots are captured from the real build.

## 16. Testing

- **Unit (`node --test`):**
  - Model rules: attempt lifecycle, the 30-minute restart, the 90-minute active window, outcome derivation, review stages and the 12-hour due window, readiness, streak across day boundaries, normalization, size caps.
  - Prompt composer: per level, statement inclusion threshold, escaping.
  - URL parsing per platform.
  - Selector and manifest assertions, with the existing tests updated.
- **Build, lint, typecheck** for both apps.
- **Manual end-to-end in the owner's Chrome**, driven by Claude via Claude in Chrome. Needs "Load unpacked" from the owner.
  - The pill appears on all three platforms, and a Submit click (works logged out; it just shows the platform's login prompt) opens the log panel.
  - The hint ladder appears on ChatGPT, Claude, Gemini, Perplexity and DeepSeek, and the appended block is inserted correctly, checked **without sending** and then cleared.
  - "Send as is", Esc, manual logging, and the re-solve badge (simulated by editing `dueAt` in storage).
  - The Everyday mode toggle, and migration from a 0.2.1 storage snapshot.
  - **Sending real prompts requires the owner's OK.** Ask once and send one prompt per AI at most.
- Store screenshots are captured from the real build during that same session.

## 17. Risks

- **AI chat DOM churn:** layered selectors, failures fall back to sending normally, and selector tests pin the known shapes.
- **Practice platform DOM churn:** the URL is the source of truth, metadata is best-effort, and the verdict only pre-fills.
- **The model ignores the level instruction:** the instruction is short, explicit and comes last. "Stay at this level" reduces leakage. Users can always escalate.
- **Permission re-approval for existing users:** accepted (about 7 users) and mentioned in release notes.

## 18. Left to the builder

Component structure and file splits beyond the modules named here, exact Tailwind styling (match the existing zinc and emerald, mono-label language), copywriting details, the topic synonyms list, test names, and the website section order and visuals.

## Appendix A: DOM observed on the live sites (2026-11-22, logged-in Chrome)

| Site | Composer | Send control | Notes |
|---|---|---|---|
| chatgpt.com | `form div.ProseMirror[contenteditable="true"]`, placeholder "Ask ChatGPT". **`#prompt-textarea` is gone.** | `form button[type="submit"][aria-label="Send"]`, only rendered when there is text. **No `data-testid` any more.** | This is why 0.2.1 doesn't fire on ChatGPT |
| claude.ai | `div[contenteditable="true"].ProseMirror`, aria-label "Write your prompt to Claude" | `button[aria-label="Send message"]` | The old exact match `"Send Message"` (capital M) misses, so click-to-send skips the gate; only Enter is caught |
| gemini.google.com | `rich-textarea div[contenteditable="true"]` (Quill) | `button[aria-label*="Send" i]`, appears with text | Existing fallbacks match |
| perplexity.ai | `div[contenteditable="true"][role="textbox"][data-lexical-editor]` (Lexical) | aria-label contains "Submit" when there is text | Existing fallbacks match |
| chat.deepseek.com | `textarea[placeholder*="DeepSeek" i]` | `div[role="button"].ds-button--primary` (a div, not a button) | Enter is the main path; the click selector is best-effort |
| leetcode.com/problems/two-sum | `.text-title-large` "1. Two Sum"; `__NEXT_DATA__` → `props.pageProps.dehydratedState.queries[].state.data.question` with `titleSlug`, `questionFrontendId`, `difficulty`, `topicTags[{name,slug}]` | `[data-e2e-locator="console-submit-button"]` | Logged-out view still shows the problem |
| geeksforgeeks.org/problems/key-pair5616/1 | `h3` title; "Difficulty: Easy" text; topic links `/explore?category[]=Arrays` | button text "Submit" | `__NEXT_DATA__` probData has `topic_tags` (["Arrays","Hash"]) and `company_tags` |
| takeuforward.org/practice/dsa/linear-search | `h1` "838. Linear Search"; difficulty badge "Basic" | button text "Submit" | Works logged out; no topic tags on the page. The A2Z sheet links here and out to LeetCode. TUF sells its own AI hints ("TUFY", Plus) |

## Appendix B: calls made after the builder check

- **Accepted-verdict parsing is cut from v1.** A Submit click opens the log panel instead.
- **Stale attempts auto-close** after 6 hours of inactivity. Trivial ones are dropped; the rest become "unsolved" and go into the re-solve queue if hints were used. Added the explicit "Didn't solve" outcome.
- **Timers measure active time.**
- **No HTML fixtures or DOM libraries in tests.** Pure parsers are unit-tested, and the DOM glue is verified live.
