export interface CognitiveEntry {
  hypothesis: string
  tried: string
  domain: string
  timestamp: number
}

export interface PendingSubmit {
  input: HTMLElement
  trigger: () => void
}

export interface OverlayController {
  show: (pending: PendingSubmit) => void
  hide: () => void
}
