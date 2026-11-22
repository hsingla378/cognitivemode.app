// Dev-only preview of the popup and dashboard outside the extension (`npx vite`, then open
// /dev/preview.html?view=popup or ?view=dashboard). Installs an in-memory chrome.* stand-in
// seeded through the real model functions, so the data follows production rules.
import { createEmptyState, finishAttempt, problemKey, recordHint, visit } from '../src/practice/model.ts'
import type { HintRequestLevel, Outcome, PracticeState, ProblemRef } from '../src/practice/types.ts'

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE
const now = Date.now()

interface SeedAttempt {
  daysAgo: number
  hint?: HintRequestLevel
  outcome: Outcome
}

const leetcode = (slug: string, number: string, title: string, difficulty: string, topics: string[]): ProblemRef => ({
  platform: 'leetcode',
  slug,
  number,
  title,
  difficulty,
  topics,
  url: `https://leetcode.com/problems/${slug}/`,
})

const HISTORY: Array<[ProblemRef, SeedAttempt[]]> = [
  [leetcode('two-sum', '1', 'Two Sum', 'Easy', ['Arrays', 'Hashing']), [{ daysAgo: 6, outcome: 'clean' }]],
  [
    leetcode('longest-substring-without-repeating-characters', '3', 'Longest Substring Without Repeating Characters', 'Medium', ['Strings', 'Sliding Window', 'Hashing']),
    [{ daysAgo: 3, hint: 2, outcome: 'hinted' }],
  ],
  [leetcode('container-with-most-water', '11', 'Container With Most Water', 'Medium', ['Arrays', 'Two Pointers']), [{ daysAgo: 1, outcome: 'clean' }]],
  [
    leetcode('coin-change', '322', 'Coin Change', 'Medium', ['Dynamic Programming', 'Arrays']),
    [{ daysAgo: 4, hint: 4, outcome: 'assisted' }],
  ],
  [
    leetcode('number-of-islands', '200', 'Number of Islands', 'Medium', ['Graphs', 'DFS', 'BFS', 'Matrix']),
    [{ daysAgo: 2, hint: 1, outcome: 'hinted' }],
  ],
  [leetcode('climbing-stairs', '70', 'Climbing Stairs', 'Easy', ['Dynamic Programming', 'Math']), [{ daysAgo: 0.2, outcome: 'clean' }]],
  [
    {
      platform: 'gfg',
      slug: 'key-pair5616',
      title: 'Two Sum - Pair with Given Sum',
      difficulty: 'Easy',
      topics: ['Arrays', 'Hashing'],
      url: 'https://www.geeksforgeeks.org/problems/key-pair5616/1',
    },
    [{ daysAgo: 5, outcome: 'clean' }],
  ],
  [
    {
      platform: 'tuf',
      slug: 'linear-search',
      number: '838',
      title: 'Linear Search',
      difficulty: 'Basic',
      topics: [],
      url: 'https://takeuforward.org/practice/dsa/linear-search',
    },
    [{ daysAgo: 7, outcome: 'clean' }],
  ],
]

const ACTIVE = leetcode('3sum', '15', '3Sum', 'Medium', ['Arrays', 'Two Pointers', 'Sorting'])

function seedPractice(): PracticeState {
  let state = createEmptyState()
  for (const [ref, attempts] of HISTORY) {
    const key = problemKey(ref.platform, ref.slug)
    for (const attempt of attempts) {
      const start = now - attempt.daysAgo * DAY
      state = visit(state, ref, start)
      if (attempt.hint) state = recordHint(state, key, attempt.hint, start + 6 * MINUTE)
      state = finishAttempt(state, key, attempt.outcome, start + 18 * MINUTE)
    }
  }
  state = visit(state, ACTIVE, now - 14 * MINUTE)
  return recordHint(state, problemKey(ACTIVE.platform, ACTIVE.slug), 1, now - 2 * MINUTE)
}

type ChangeListener = (changes: Record<string, { newValue: unknown }>, area: string) => void
const listeners = new Set<ChangeListener>()
const storage: Record<string, unknown> = {
  cm_practice_v1: seedPractice(),
  cognitive_settings: { countdownDuration: 15, enabled: true, practiceMode: true, everydayMode: false },
  cognitive_entries: [
    {
      hypothesis: 'The stale closure keeps the old count because the effect has an empty dependency array',
      tried: 'Logged inside the effect, added count to the deps, checked React DevTools',
      domain: 'chatgpt.com',
      timestamp: now - 20 * DAY,
    },
  ],
}

const fakeChrome = {
  storage: {
    local: {
      async get(key: string) {
        return key in storage ? { [key]: structuredClone(storage[key]) } : {}
      },
      async set(values: Record<string, unknown>) {
        Object.assign(storage, structuredClone(values))
        const changes = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { newValue: value }]))
        for (const listener of listeners) listener(changes, 'local')
      },
    },
    onChanged: {
      addListener: (listener: ChangeListener) => listeners.add(listener),
      removeListener: (listener: ChangeListener) => listeners.delete(listener),
    },
  },
  tabs: { create: ({ url }: { url: string }) => window.open(url, '_blank') },
  runtime: { getURL: (path: string) => `/${path}` },
}

;(globalThis as unknown as { chrome: typeof fakeChrome }).chrome = fakeChrome

if (new URLSearchParams(window.location.search).get('view') === 'dashboard') {
  await import('../src/History.tsx')
} else {
  document.body.classList.add('popup-page')
  await import('../src/main.tsx')
}
