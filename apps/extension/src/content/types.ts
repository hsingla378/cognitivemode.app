import type { ProblemRecord } from '../practice/types.ts'

export interface CognitiveEntry {
  hypothesis: string
  tried: string
  domain: string
  timestamp: number
  durationSeconds?: number
}

export interface PendingSubmit {
  input: HTMLElement
  trigger: () => void
  /** Current composer text, read when the overlay acts on it. */
  getText: () => string
}

export type OverlayView = { mode: 'everyday' } | { mode: 'practice'; problem: ProblemRecord }

export interface OverlayController {
  show: (pending: PendingSubmit, view: OverlayView) => void
  hide: () => void
  destroy: () => void
}
