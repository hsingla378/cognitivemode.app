import { useEffect, useState } from 'react'
import type { PendingSubmit } from './types'

const COUNTDOWN_SECONDS = 15
const MIN_CHARS = 10

export interface HypothesisGateData {
  hypothesis: string
  tried: string
}

interface FrictionOverlayProps {
  pending: PendingSubmit | null
  onSubmit: (data: HypothesisGateData) => void | Promise<void>
  onDismiss: () => void
}

export default function FrictionOverlay({ pending, onSubmit, onDismiss }: FrictionOverlayProps) {
  const [hypothesis, setHypothesis] = useState('')
  const [tried, setTried] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const [submitting, setSubmitting] = useState(false)
  const [hidden, setHidden] = useState(false)

  const timerDone = secondsLeft === 0
  const hypothesisValid = hypothesis.trim().length >= MIN_CHARS
  const triedValid = tried.trim().length >= MIN_CHARS
  const canUnlock = timerDone && hypothesisValid && triedValid && !submitting
  const visible = pending !== null && !hidden

  useEffect(() => {
    if (!pending) return

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)

    return () => clearInterval(intervalId)
  }, [pending])

  async function handleUnlock() {
    if (!canUnlock) return
    setSubmitting(true)
    setHidden(true)
    try {
      await onSubmit({ hypothesis: hypothesis.trim(), tried: tried.trim() })
    } finally {
      setSubmitting(false)
    }
  }

  const countdownProgress = ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100

  return (
    <div
      className={`fixed inset-0 z-[2147483647] flex items-center justify-center p-4 transition-all duration-500 ${
        visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-[rgba(0,0,0,0.55)] backdrop-blur-md transition-opacity duration-500 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onDismiss}
        tabIndex={visible ? 0 : -1}
        aria-label="Dismiss overlay"
      />

      <div
        className={`relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.1)] bg-[rgba(12,12,16,0.55)] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl transition-all duration-500 ${
          visible ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.97]'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hypothesis-gate-title"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120,119,198,0.18), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(16,185,129,0.08), transparent)',
          }}
        />

        <div className="relative">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted/80">
                  hypothesis gate
                </p>
              </div>
              <h2
                id="hypothesis-gate-title"
                className="text-lg font-medium tracking-tight text-foreground"
              >
                Pause before you prompt
              </h2>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-1">
              <div className="relative flex h-14 w-14 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56" aria-hidden>
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke={timerDone ? 'rgba(16,185,129,0.8)' : 'rgba(251,191,36,0.7)'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(countdownProgress / 100) * 150.8} 150.8`}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <span
                  className={`font-mono text-sm font-semibold tabular-nums ${
                    timerDone ? 'text-emerald-400' : 'text-amber-300'
                  }`}
                >
                  {timerDone ? '✓' : secondsLeft}
                </span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted/50">
                {timerDone ? 'ready' : 'wait'}
              </span>
            </div>
          </div>

          <p className="mb-6 max-w-lg text-sm leading-relaxed text-muted/90">
            Articulate your thinking before the AI does it for you. Both fields need at least{' '}
            {MIN_CHARS} characters, and the timer must reach zero.
          </p>

          <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="cognitive-hypothesis"
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted/70"
              >
                What is your hypothesis?
              </label>
              <textarea
                id="cognitive-hypothesis"
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                rows={5}
                placeholder="I think the issue is…"
                className="resize-none rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3.5 py-3 text-sm text-foreground placeholder:text-muted/35 outline-none ring-0 transition focus:border-[rgba(255,255,255,0.18)] focus:bg-[rgba(255,255,255,0.06)]"
              />
              <p
                className={`font-mono text-[10px] tabular-nums ${
                  hypothesisValid ? 'text-emerald-400/70' : 'text-muted/40'
                }`}
              >
                {hypothesis.trim().length}/{MIN_CHARS} min
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="cognitive-tried"
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted/70"
              >
                What have you already tried?
              </label>
              <textarea
                id="cognitive-tried"
                value={tried}
                onChange={(e) => setTried(e.target.value)}
                rows={5}
                placeholder="I already checked…"
                className="resize-none rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3.5 py-3 text-sm text-foreground placeholder:text-muted/35 outline-none ring-0 transition focus:border-[rgba(255,255,255,0.18)] focus:bg-[rgba(255,255,255,0.06)]"
              />
              <p
                className={`font-mono text-[10px] tabular-nums ${
                  triedValid ? 'text-emerald-400/70' : 'text-muted/40'
                }`}
              >
                {tried.trim().length}/{MIN_CHARS} min
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-[rgba(255,255,255,0.06)] pt-5">
            <p className="font-mono text-[10px] text-muted/45">
              {!timerDone
                ? `Timer: ${secondsLeft}s remaining`
                : !hypothesisValid || !triedValid
                  ? `Need ${MIN_CHARS}+ characters in each field`
                  : 'All conditions met.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onDismiss}
                className="font-mono text-[10px] text-muted/50 transition hover:text-muted"
              >
                dismiss
              </button>
              <button
                type="button"
                onClick={handleUnlock}
                disabled={!canUnlock}
                className="rounded-full border border-emerald-400/40 bg-[rgba(16,185,129,0.1)] px-6 py-2.5 font-mono text-xs font-medium text-foreground shadow-[0_0_24px_rgba(16,185,129,0.15)] transition enabled:hover:border-emerald-300/60 enabled:hover:bg-[rgba(16,185,129,0.18)] enabled:hover:shadow-[0_0_32px_rgba(16,185,129,0.3)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                {submitting ? 'Unlocking…' : 'Unlock Prompt'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
