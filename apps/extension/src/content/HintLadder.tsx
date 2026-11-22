import { useEffect, useState } from 'react'
import { activeTimeMs, currentAttempt } from '../practice/model.ts'
import { PLATFORM_LABELS } from '../practice/platforms.ts'
import { HINT_LEVELS } from '../practice/prompt.ts'
import type { HintRequestLevel, ProblemRecord } from '../practice/types.ts'
import type { HintSendResult } from './hintSend.ts'
import type { PendingSubmit } from './types'

const LEVELS: HintRequestLevel[] = [1, 2, 3, 4]
const APPROACH_FIELD_ID = 'cm-approach'

interface HintLadderProps {
  pending: PendingSubmit | null
  problem: ProblemRecord | null
  onSendWithHint: (level: HintRequestLevel, approach: string) => Promise<HintSendResult>
  onSendAsIs: () => void
  onDismiss: () => void
}

type Status = 'idle' | 'sending' | 'copied' | 'failed'

function minutesIn(problem: ProblemRecord): number {
  const attempt = currentAttempt(problem)
  return attempt ? Math.max(1, Math.round(activeTimeMs(attempt, Date.now(), false) / 60_000)) : 0
}

function keyOrigin(event: KeyboardEvent): EventTarget | undefined {
  // composedPath() reaches inside our open shadow root, unlike event.target.
  return event.composedPath()[0]
}

export default function HintLadder({ pending, problem, onSendWithHint, onSendAsIs, onDismiss }: HintLadderProps) {
  const attempt = problem ? currentAttempt(problem) : undefined
  const [level, setLevel] = useState<HintRequestLevel>(
    attempt && attempt.maxHintLevel > 0 ? (attempt.maxHintLevel as HintRequestLevel) : 1,
  )
  const [approach, setApproach] = useState(attempt?.approach ?? '')
  const [status, setStatus] = useState<Status>('idle')
  const visible = pending !== null && problem !== null

  async function send() {
    if (status === 'sending') return
    setStatus('sending')
    const result = await onSendWithHint(level, approach)
    setStatus(result === 'sent' ? 'idle' : result)
  }

  useEffect(() => {
    if (!visible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only real keypresses. The Enter we dispatch to send on ChatGPT is synthetic, and this
      // listener can outlive the overlay by a frame (effect cleanup runs after paint).
      if (!event.isTrusted) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onDismiss()
        return
      }

      const origin = keyOrigin(event)
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        // A focused button activates itself on Enter; cancelling here would swallow its click.
        if (origin instanceof HTMLButtonElement) return
        event.preventDefault()
        event.stopPropagation()
        void send()
        return
      }

      const typingNote = origin instanceof HTMLElement && origin.id === APPROACH_FIELD_ID
      if (typingNote) return

      if (event.key === '0') {
        event.preventDefault()
        onSendAsIs()
      } else if (['1', '2', '3', '4'].includes(event.key)) {
        event.preventDefault()
        setLevel(Number(event.key) as HintRequestLevel)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  })

  if (!visible || !problem) return null

  const minutes = minutesIn(problem)
  const meta = [PLATFORM_LABELS[problem.platform], problem.difficulty, minutes ? `${minutes} min in` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="pointer-events-auto fixed inset-0 z-[2147483647] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
        aria-label="Close without sending"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-hint-title"
        className="relative z-10 w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-950/90 p-6 text-left shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400/80">
              practice mode
            </p>
            <h2 id="cm-hint-title" className="truncate text-sm font-medium text-zinc-100">
              {problem.title}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">{meta}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-600 transition hover:text-zinc-300"
          >
            esc
          </button>
        </div>

        <p id="cm-level-label" className="mb-2 text-sm text-zinc-300">
          How much help do you want?
        </p>
        <div role="radiogroup" aria-labelledby="cm-level-label" className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LEVELS.map((option) => {
            const selected = option === level
            const solution = option === 4
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setLevel(option)}
                className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition ${
                  selected
                    ? solution
                      ? 'border-amber-400/60 bg-amber-400/10'
                      : 'border-emerald-400/60 bg-emerald-400/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-100">
                  <span className="font-mono text-[10px] text-zinc-500">{option}</span>
                  {HINT_LEVELS[option].name}
                </span>
                <span className="text-[11px] leading-snug text-zinc-500">{HINT_LEVELS[option].blurb}</span>
              </button>
            )
          })}
        </div>

        <label htmlFor={APPROACH_FIELD_ID} className="mb-1.5 block text-xs text-zinc-400">
          Your approach so far <span className="text-zinc-600">(optional, sent to the AI)</span>
        </label>
        <textarea
          id={APPROACH_FIELD_ID}
          value={approach}
          onChange={(event) => setApproach(event.target.value)}
          rows={2}
          placeholder="e.g. sort first, then move two pointers inward?"
          className="mb-4 w-full resize-none rounded-lg border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/50"
        />

        {status === 'copied' && (
          <p role="status" className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            Couldn&apos;t add the hint level automatically, so it&apos;s copied. Close this, click at the end
            of your message, paste (⌘V / Ctrl+V) and send.
          </p>
        )}
        {status === 'failed' && (
          <p role="status" className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-100">
            Couldn&apos;t add the hint level here. Close this and send as is, or try again.
          </p>
        )}

        <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onSendAsIs}
            className="text-left text-xs text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline"
          >
            Not about this problem? Send as is{' '}
            <kbd className="ml-1 rounded border border-white/15 px-1 font-mono text-[10px] text-zinc-400">0</kbd>
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => void send()}
            disabled={status === 'sending'}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending…' : `Send with ${HINT_LEVELS[level].name.toLowerCase()} ↵`}
          </button>
        </div>
      </div>
    </div>
  )
}
