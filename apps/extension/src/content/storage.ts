import type { CognitiveEntry } from './types'

const STORAGE_KEY = 'cognitive_entries'
const SETTINGS_KEY = 'cognitive_settings'
const DEFAULT_COUNTDOWN_DURATION = 15
const SECONDS_PER_INTERCEPTION = 15

export interface Settings {
  countdownDuration: number
}

export interface Stats {
  totalInterceptions: number
  timeSavedThinking: string
  activeStreak: number
}

const DEFAULT_SETTINGS: Settings = {
  countdownDuration: DEFAULT_COUNTDOWN_DURATION,
}

export async function getCognitiveLogs(): Promise<CognitiveEntry[]> {
  const { [STORAGE_KEY]: existing } = await chrome.storage.local.get(STORAGE_KEY)
  return Array.isArray(existing) ? existing : []
}

function formatTimeSaved(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins} mins ${secs} secs`
}

export async function getStats(): Promise<Stats> {
  const logs = await getCognitiveLogs()
  const totalInterceptions = logs.length
  const totalSeconds = totalInterceptions * SECONDS_PER_INTERCEPTION

  return {
    totalInterceptions,
    timeSavedThinking: formatTimeSaved(totalSeconds),
    activeStreak: totalInterceptions,
  }
}

export async function getSettings(): Promise<Settings> {
  const { [SETTINGS_KEY]: stored } = await chrome.storage.local.get(SETTINGS_KEY)
  if (
    stored &&
    typeof stored === 'object' &&
    'countdownDuration' in stored &&
    typeof stored.countdownDuration === 'number'
  ) {
    return { ...DEFAULT_SETTINGS, ...(stored as Settings) }
  }
  return { ...DEFAULT_SETTINGS }
}

export async function saveSettings(settings: Settings): Promise<void> {
  const current = await getSettings()
  await chrome.storage.local.set({
    [SETTINGS_KEY]: { ...current, ...settings },
  })
}

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

  const entries = await getCognitiveLogs()
  entries.push(entry)

  await chrome.storage.local.set({ [STORAGE_KEY]: entries.slice(-50) })
}
