import { createRoot } from 'react-dom/client'
import type { HintRequestLevel } from '../practice/types.ts'
import HintLadder from './HintLadder'
import type { HintSendResult } from './hintSend.ts'
import FrictionOverlay from './Overlay'
import type { HypothesisGateData } from './Overlay'
import { createShadowHost } from './shadowHost'
import type { OverlayController, OverlayView, PendingSubmit } from './types'

const HOST_CSS =
  'display: block !important; visibility: visible !important; opacity: 1 !important; position: fixed !important; inset: 0 !important; z-index: 2147483647 !important; pointer-events: none !important;'
const FADE_MS = 500

interface MountOptions {
  onSubmit: (data: HypothesisGateData) => void | Promise<void>
  onSelfSolved: (data: HypothesisGateData) => void | Promise<void>
  onDismiss: () => void
  onSendWithHint: (level: HintRequestLevel, approach: string) => Promise<HintSendResult>
  onSendAsIs: () => void
}

export function mountOverlay(options: MountOptions): OverlayController {
  const shadowHost = createShadowHost('cognitive-mode-overlay', HOST_CSS)

  let pending: PendingSubmit | null = null
  let view: OverlayView | null = null
  let overlayVersion = 0

  const root = createRoot(shadowHost.app)

  const close = () => {
    pending = null
    view = null
    overlayVersion += 1
    render()
  }

  const closeAfterFade = () => {
    window.setTimeout(close, FADE_MS)
  }

  function render() {
    if (view?.mode === 'practice') {
      root.render(
        <HintLadder
          key={overlayVersion}
          pending={pending}
          problem={view.problem}
          onSendWithHint={async (level, approach) => {
            const result = await options.onSendWithHint(level, approach)
            if (result === 'sent') close()
            return result
          }}
          onSendAsIs={() => {
            close()
            options.onSendAsIs()
          }}
          onDismiss={() => {
            close()
            options.onDismiss()
          }}
        />,
      )
      return
    }

    root.render(
      <FrictionOverlay
        key={overlayVersion}
        pending={pending}
        onSubmit={async (data) => {
          await options.onSubmit(data)
          closeAfterFade()
        }}
        onSelfSolved={async (data) => {
          await options.onSelfSolved(data)
          closeAfterFade()
        }}
        onDismiss={() => {
          close()
          options.onDismiss()
        }}
      />,
    )
  }

  render()

  return {
    show(nextPending, nextView) {
      pending = nextPending
      view = nextView
      overlayVersion += 1
      render()
    },
    hide: close,
    destroy() {
      root.unmount()
      shadowHost.destroy()
    },
  }
}
