import type { CognitiveEntry } from './types'

const STORAGE_KEY = 'cognitive_entries'

export async function saveCognitiveLog(
  hypothesis: string,
  tried: string,
): Promise<void> {
  const entry: CognitiveEntry = {
    hypothesis,
    tried,
    domain: location.hostname,
    timestamp: Date.now(),
  }

  const { [STORAGE_KEY]: existing } = await chrome.storage.local.get(STORAGE_KEY)
  const entries: CognitiveEntry[] = Array.isArray(existing) ? existing : []
  entries.push(entry)

  await chrome.storage.local.set({ [STORAGE_KEY]: entries.slice(-50) })
}
