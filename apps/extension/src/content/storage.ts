import type { CognitiveEntry } from './types'

const STORAGE_KEY = 'cognitive_entries'
const SETTINGS_KEY = 'cognitive_settings'
const BYPASS_KEY = 'cognitive_daily_bypass'
const DAILY_BYPASS_LIMIT = 1
const DEFAULT_COUNTDOWN_DURATION = 15
const MIN_COUNTDOWN_DURATION = 5
const MAX_COUNTDOWN_DURATION = 60
const SECONDS_PER_INTERCEPTION = 15

export interface Settings {
  countdownDuration: number
}

export interface Stats {
  totalInterceptions: number
  timeSavedThinking: string
  activeStreak: number
}

interface BypassState {
  date: string
  remaining: number
}

const DEFAULT_SETTINGS: Settings = {
  countdownDuration: DEFAULT_COUNTDOWN_DURATION,
}

function clampCountdownDuration(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_COUNTDOWN_DURATION
  return Math.min(MAX_COUNTDOWN_DURATION, Math.max(MIN_COUNTDOWN_DURATION, Math.round(value)))
}

function getCalendarDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function readBypassState(): Promise<BypassState> {
  const today = getCalendarDate()
  const { [BYPASS_KEY]: stored } = await chrome.storage.local.get(BYPASS_KEY)

  if (
    stored &&
    typeof stored === 'object' &&
    'date' in stored &&
    'remaining' in stored &&
    typeof stored.date === 'string' &&
    typeof stored.remaining === 'number' &&
    stored.date === today
  ) {
    return {
      date: today,
      remaining: Math.max(0, stored.remaining),
    }
  }

  return { date: today, remaining: DAILY_BYPASS_LIMIT }
}

export async function getBypasses(): Promise<number> {
  const state = await readBypassState()
  return state.remaining
}

export async function useBypass(): Promise<boolean> {
  const state = await readBypassState()
  if (state.remaining <= 0) return false

  await chrome.storage.local.set({
    [BYPASS_KEY]: {
      date: state.date,
      remaining: state.remaining - 1,
    },
  })

  return true
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
    return {
      ...DEFAULT_SETTINGS,
      ...(stored as Settings),
      countdownDuration: clampCountdownDuration(stored.countdownDuration),
    }
  }
  return { ...DEFAULT_SETTINGS }
}

export async function saveSettings(settings: Settings): Promise<void> {
  const current = await getSettings()
  await chrome.storage.local.set({
    [SETTINGS_KEY]: {
      ...current,
      ...settings,
      countdownDuration: clampCountdownDuration(settings.countdownDuration),
    },
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
