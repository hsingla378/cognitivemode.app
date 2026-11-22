import { safeStorageGet, safeStorageSet } from '../content/storage.ts'
import { coerceState, normalize, trimState } from './model.ts'
import type { PracticeState } from './types.ts'

export const PRACTICE_STATE_KEY = 'cm_practice_v1'

async function readStored(): Promise<unknown> {
  const { [PRACTICE_STATE_KEY]: stored } = await safeStorageGet(PRACTICE_STATE_KEY, {})
  return stored
}

export async function readPracticeState(now = Date.now()): Promise<PracticeState> {
  return normalize(coerceState(await readStored()), now)
}

// Key order differs between freshly built and coerced records, so compare a key-sorted form.
function canonicalJson(value: unknown): string | undefined {
  return JSON.stringify(value, (_key, item: unknown) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : item,
  )
}

// Writes from one tab run one after another so concurrent updates don't overwrite each other.
// Across tabs the race window is a few milliseconds and costs at most one heartbeat or hint count.
let queue: Promise<unknown> = Promise.resolve()

export function updatePracticeState(
  update: (state: PracticeState, now: number) => PracticeState,
): Promise<PracticeState> {
  const run = queue.then(async () => {
    const now = Date.now()
    const stored = await readStored()
    const next = trimState(update(normalize(coerceState(stored), now), now))
    // Skipping no-op writes keeps storage.onChanged listeners (like the badge) from looping.
    if (canonicalJson(next) !== canonicalJson(stored)) {
      await safeStorageSet({ [PRACTICE_STATE_KEY]: next })
    }
    return next
  })
  queue = run.catch(() => undefined)
  return run
}

export function onPracticeStateChange(listener: (state: PracticeState) => void): () => void {
  const handleChange = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'local' || !changes[PRACTICE_STATE_KEY]) return
    listener(coerceState(changes[PRACTICE_STATE_KEY].newValue))
  }

  chrome.storage.onChanged.addListener(handleChange)
  return () => chrome.storage.onChanged.removeListener(handleChange)
}
