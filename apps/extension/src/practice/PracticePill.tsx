import { useEffect, useState } from 'react'
import { activeTimeMs, currentAttempt, deriveOutcome } from './model.ts'
import { LOG_OPTIONS, formatClock, hintSummary, loggedMessage } from './pillText.ts'
import type { Outcome, ProblemRecord } from './types.ts'

const MESSAGE_MS = 4000

export interface PracticePillProps {
  record: ProblemRecord | null
  collapsed: boolean
  /** Bumped after a Submit click to open the log panel. */
  autoOpenToken: number
  onLog: (outcome: Outcome) => Promise<ProblemRecord | null>
  onToggleCollapsed: () => void
}

export default function PracticePill({ record, collapsed, autoOpenToken, onLog, onToggleCollapsed }: PracticePillProps) {
  const [now, setNow] = useState(() => Date.now())
  const [logOpen, setLogOpen] = useState(false)
  const [seenToken, setSeenToken] = useState(autoOpenToken)
  const [message, setMessage] = useState<string | null>(null)
  const attempt = record ? currentAttempt(record) : undefined
  const ticking = !!attempt

  useEffect(() => {
    if (!ticking) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [ticking])

  if (!record) return null

  const submitted = autoOpenToken !== seenToken
  const panelOpen = !!attempt && (logOpen || submitted)
  const derived = attempt ? deriveOutcome(attempt.maxHintLevel) : 'clean'

  function closePanel() {
    setLogOpen(false)
    setSeenToken(autoOpenToken)
  }

  async function log(outcome: Outcome) {
    closePanel()
    const updated = await onLog(outcome)
    if (!updated) return
    // `now` ticks every second while an attempt is open, which is the only time logging is offered.
    setMessage(loggedMessage(updated, now))
    window.setTimeout(() => setMessage(null), MESSAGE_MS)
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label="Show practice timer"
        className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-950/90 shadow-lg backdrop-blur-xl"
      >
        <span className={`h-2 w-2 rounded-full ${attempt ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
      </button>
    )
  }

  const live = typeof document !== 'undefined' && document.visibilityState === 'visible'

  return (
    <div className="pointer-events-auto flex flex-col items-start gap-2 font-sans">
      {panelOpen && (
        <div
          role="dialog"
          aria-label="Log your result"
          className="w-64 rounded-2xl border border-white/10 bg-zinc-950/95 p-4 text-left shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400/80">
            {submitted ? 'submitted' : 'log result'}
          </p>
          <p className="mb-3 text-sm text-zinc-100">How did it go?</p>
          <div className="grid gap-1.5">
            {LOG_OPTIONS.map((option) => (
              <button
                key={option.outcome}
                type="button"
                onClick={() => void log(option.outcome)}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                  option.outcome === derived
                    ? 'border-emerald-400/60 bg-emerald-400/10 text-zinc-100'
                    : 'border-white/10 text-zinc-300 hover:border-white/25'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={closePanel}
            className="mt-3 text-xs text-zinc-500 transition hover:text-zinc-300"
          >
            Not now
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/90 py-1.5 pl-3 pr-1.5 text-xs text-zinc-300 shadow-lg backdrop-blur-xl">
        <span className={`h-2 w-2 shrink-0 rounded-full ${attempt ? 'animate-pulse bg-emerald-400' : 'bg-zinc-500'}`} />
        {message ? (
          <span className="text-emerald-200">{message}</span>
        ) : attempt ? (
          <span>
            Practicing ·{' '}
            <span className="font-mono tabular-nums text-zinc-100">{formatClock(activeTimeMs(attempt, now, live))}</span>{' '}
            · {hintSummary(attempt.maxHintLevel)}
          </span>
        ) : (
          <span>{loggedMessage(record, now)}</span>
        )}
        {attempt && !panelOpen && (
          <button
            type="button"
            onClick={() => setLogOpen(true)}
            className="rounded-full bg-white/10 px-2.5 py-1 text-zinc-100 transition hover:bg-white/20"
          >
            Log result
          </button>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Minimize practice timer"
          className="rounded-full px-1.5 text-zinc-500 transition hover:text-zinc-200"
        >
          –
        </button>
      </div>
    </div>
  )
}
