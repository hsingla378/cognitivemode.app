import { useEffect, useState } from 'react'
import { consumeDailyBypass, getBypasses, getSettings } from './storage'
import type { PendingSubmit } from './types'

const DEFAULT_COUNTDOWN_SECONDS = 15
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

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function FrictionOverlay({ pending, onSubmit, onDismiss }: FrictionOverlayProps) {
  const [hypothesis, setHypothesis] = useState('')
  const [tried, setTried] = useState('')
  const [countdownDuration, setCountdownDuration] = useState(DEFAULT_COUNTDOWN_SECONDS)
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_COUNTDOWN_SECONDS)
  const [submitting, setSubmitting] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [bypassesLeft, setBypassesLeft] = useState(0)

  const timerDone = secondsLeft === 0
  const hypothesisValid = hypothesis.trim().length >= MIN_CHARS
  const triedValid = tried.trim().length >= MIN_CHARS
  const canUnlock = timerDone && hypothesisValid && triedValid && !submitting
  const visible = pending !== null && !hidden

  useEffect(() => {
    let cancelled = false

    void getSettings().then((settings) => {
      if (cancelled) return
      setCountdownDuration(settings.countdownDuration)
      setSecondsLeft(settings.countdownDuration)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!pending) return

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)

    return () => clearInterval(intervalId)
  }, [pending, countdownDuration])

  useEffect(() => {
    if (!pending) return

    let cancelled = false

    void getBypasses().then((remaining) => {
      if (!cancelled) setBypassesLeft(remaining)
    })

    return () => {
      cancelled = true
    }
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

  async function handleEmergencySkip() {
    if (submitting || bypassesLeft <= 0) return

    const used = await consumeDailyBypass()
    if (!used) {
      setBypassesLeft(0)
      return
    }

    setBypassesLeft((prev) => Math.max(0, prev - 1))
    setSubmitting(true)
    setHidden(true)
    try {
      await onSubmit({ hypothesis: hypothesis.trim(), tried: tried.trim() })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[2147483647] flex items-center justify-center p-4 transition-all duration-500 ${
        visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onDismiss}
        tabIndex={visible ? 0 : -1}
        aria-label="Dismiss overlay"
      />

      <div
        className={`relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-500 ${
          visible ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.97]'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hypothesis-gate-title"
      >
        <div className="relative">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                hypothesis gate
              </p>
              <h2
                id="hypothesis-gate-title"
                className="text-sm font-medium tracking-tight text-zinc-200"
              >
                Pause before you prompt
              </h2>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 transition hover:text-zinc-400"
            >
              dismiss
            </button>
          </div>

          <div className="mb-10 flex justify-center">
            <span
              className={`select-none font-mono text-7xl font-light tabular-nums tracking-tighter transition-colors duration-700 ${
                timerDone ? 'text-emerald-400/90' : 'text-zinc-100'
              }`}
              aria-live="polite"
              aria-label={timerDone ? 'Timer complete' : `${secondsLeft} seconds remaining`}
            >
              {formatCountdown(secondsLeft)}
            </span>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cognitive-hypothesis"
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500"
              >
                What is your hypothesis?
              </label>
              <textarea
                id="cognitive-hypothesis"
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                rows={5}
                placeholder="I think the issue is…"
                className="friction-textarea w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-2.5 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow] duration-200 focus:border-white/30 focus:shadow-[0_1px_0_0_rgba(255,255,255,0.35)]"
              />
              <p
                className={`font-mono text-xs tabular-nums ${
                  hypothesisValid ? 'text-emerald-400' : 'text-red-400/80'
                }`}
              >
                {hypothesis.trim().length}/{MIN_CHARS} chars
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cognitive-tried"
                className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500"
              >
                What have you already tried?
              </label>
              <textarea
                id="cognitive-tried"
                value={tried}
                onChange={(e) => setTried(e.target.value)}
                rows={5}
                placeholder="I already checked…"
                className="friction-textarea w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-2.5 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow] duration-200 focus:border-white/30 focus:shadow-[0_1px_0_0_rgba(255,255,255,0.35)]"
              />
              <p
                className={`font-mono text-xs tabular-nums ${
                  triedValid ? 'text-emerald-400' : 'text-red-400/80'
                }`}
              >
                {tried.trim().length}/{MIN_CHARS} chars
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={handleUnlock}
              disabled={!canUnlock}
              className={`rounded-lg px-7 py-2.5 text-sm font-medium transition-all duration-300 ${
                canUnlock
                  ? 'cursor-pointer bg-white text-zinc-950 shadow-[0_0_32px_rgba(255,255,255,0.2),0_0_64px_rgba(255,255,255,0.08)] hover:bg-zinc-100 hover:shadow-[0_0_40px_rgba(255,255,255,0.35),0_0_80px_rgba(255,255,255,0.12)]'
                  : 'cursor-not-allowed bg-zinc-800/40 text-zinc-600 opacity-40'
              }`}
            >
              {submitting ? 'Unlocking…' : 'Unlock Prompt'}
            </button>
            {bypassesLeft > 0 && (
              <button
                type="button"
                onClick={handleEmergencySkip}
                disabled={submitting}
                className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 transition hover:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Emergency Skip ({bypassesLeft} left today)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
