import { DAY_MS } from './model.ts'
import type { HintLevel, Outcome, ProblemRecord } from './types.ts'

export const LOG_OPTIONS: ReadonlyArray<{ outcome: Outcome; label: string }> = [
  { outcome: 'clean', label: 'Solved clean' },
  { outcome: 'hinted', label: 'Solved with hints' },
  { outcome: 'assisted', label: 'Needed the solution' },
  { outcome: 'unsolved', label: "Didn't solve" },
]

const pad = (value: number) => String(value).padStart(2, '0')

export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

export function hintSummary(level: HintLevel): string {
  if (level === 0) return 'no hints yet'
  if (level <= 2) return 'used a hint'
  return level === 3 ? 'used an outline' : 'saw the solution'
}

export function loggedMessage(record: ProblemRecord, now: number): string {
  if (record.review) {
    const days = Math.max(1, Math.round((record.review.dueAt - now) / DAY_MS))
    return `Logged · back in ${days} ${days === 1 ? 'day' : 'days'} for a clean re-solve`
  }
  if (record.graduatedAt !== undefined && now - record.graduatedAt < DAY_MS) return 'Logged · this one is locked in'
  return 'Logged'
}
