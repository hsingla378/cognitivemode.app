import { HINT_LEVELS } from '../practice/prompt.ts'
import type { Attempt, HintLevel, Outcome } from '../practice/types.ts'

export const OUTCOME_LABELS: Record<Outcome, string> = {
  clean: 'Clean',
  hinted: 'Hinted',
  assisted: 'Needed solution',
  unsolved: 'Unsolved',
}

export const OUTCOME_STYLES: Record<Outcome | 'open', string> = {
  clean: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  hinted: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
  assisted: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  unsolved: 'border-zinc-600 bg-zinc-800/60 text-zinc-300',
  open: 'border-zinc-700 bg-zinc-900 text-zinc-400',
}

export function outcomeLabel(attempt: Attempt): string {
  if (!attempt.outcome) return 'In progress'
  return attempt.autoClosed ? `${OUTCOME_LABELS[attempt.outcome]} (auto)` : OUTCOME_LABELS[attempt.outcome]
}

export function helpLabel(level: HintLevel): string {
  return level === 0 ? 'None' : HINT_LEVELS[level].name
}

export function formatShortDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(timestamp))
}
