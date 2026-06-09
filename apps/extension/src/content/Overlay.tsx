import { useEffect, useState } from 'react'
import type { PendingSubmit } from './types'

interface OverlayProps {
  pending: PendingSubmit | null
  onUnlock: (hypothesis: string, tried: string) => Promise<void>
  onDismiss: () => void
}

export default function Overlay({ pending, onUnlock, onDismiss }: OverlayProps) {
  const [hypothesis, setHypothesis] = useState('')
  const [tried, setTried] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const visible = pending !== null
  const bothFilled = hypothesis.trim().length > 0 && tried.trim().length > 0

  useEffect(() => {
    if (!pending) {
      setHypothesis('')
      setTried('')
      setSubmitting(false)
    }
  }, [pending])

  async function handleUnlock() {
    if (!bothFilled || submitting) return
    setSubmitting(true)
    try {
      await onUnlock(hypothesis.trim(), tried.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[2147483647] flex items-center justify-center p-4 transition-all duration-300 ${
        visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-[rgba(0,0,0,0.72)] backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onDismiss}
        tabIndex={visible ? 0 : -1}
        aria-label="Dismiss overlay"
      />

      <div
        className={`relative z-10 w-full max-w-2xl rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(9,9,11,0.94)] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-all duration-300 ${
          visible ? 'translate-y-0 scale-100' : 'translate-y-3 scale-[0.98]'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cognitive-mode-title"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <p
              id="cognitive-mode-title"
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted"
            >
              cognitive mode intercepted
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="font-mono text-[10px] text-muted/50 transition hover:text-muted"
          >
            dismiss
          </button>
        </div>

        <p className="mb-5 max-w-lg text-xs leading-relaxed text-muted">
          Before you ask the AI — articulate your thinking. Both fields are required to unlock
          submission.
        </p>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cognitive-hypothesis"
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted/70"
            >
              1. What is your hypothesis?
            </label>
            <textarea
              id="cognitive-hypothesis"
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              rows={4}
              placeholder="I think the issue is…"
              className="resize-none rounded-lg border border-border bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-xs text-foreground placeholder:text-muted/40 outline-none transition focus:border-zinc-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cognitive-tried"
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted/70"
            >
              2. What have you already tried?
            </label>
            <textarea
              id="cognitive-tried"
              value={tried}
              onChange={(e) => setTried(e.target.value)}
              rows={4}
              placeholder="I already checked…"
              className="resize-none rounded-lg border border-border bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-xs text-foreground placeholder:text-muted/40 outline-none transition focus:border-zinc-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] text-muted/40">
            {bothFilled ? 'Ready to unlock and send.' : 'Fill both fields to unlock.'}
          </p>
          <button
            type="button"
            onClick={handleUnlock}
            disabled={!bothFilled || submitting}
            className="rounded-full border border-emerald-400/50 bg-[rgba(16,185,129,0.08)] px-5 py-2 font-mono text-xs font-medium text-foreground shadow-[0_0_20px_rgba(16,185,129,0.2)] transition enabled:hover:border-emerald-300 enabled:hover:bg-[rgba(16,185,129,0.15)] enabled:hover:shadow-[0_0_28px_rgba(16,185,129,0.35)] disabled:cursor-not-allowed disabled:opacity-25"
          >
            {submitting ? 'Sending…' : bothFilled ? 'Unlock & send →' : 'Fill both fields →'}
          </button>
        </div>
      </div>
    </div>
  )
}
