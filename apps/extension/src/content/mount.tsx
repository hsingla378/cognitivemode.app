import { createRoot } from 'react-dom/client'
import FrictionOverlay from './Overlay'
import type { HypothesisGateData } from './Overlay'
import styles from './content.css?inline'
import type { OverlayController, PendingSubmit } from './types'

const HOST_ID = 'cognitive-mode-root'
const FADE_MS = 500

interface MountOptions {
  onSubmit: (data: HypothesisGateData) => void | Promise<void>
  onDismiss: () => void
}

export function mountOverlay(options: MountOptions): OverlayController {
  const existing = document.getElementById(HOST_ID)
  existing?.remove()

  const host = document.createElement('div')
  host.id = HOST_ID
  host.style.cssText =
    'position: fixed !important; inset: 0 !important; z-index: 2147483647 !important; pointer-events: none !important;'

  const attachHost = () => {
    const container = document.documentElement
    if (host.parentElement !== container) {
      container.appendChild(host)
    }
  }

  attachHost()

  const shadow = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = styles
  shadow.appendChild(style)

  const app = document.createElement('div')
  app.id = 'cognitive-mode-app'
  shadow.appendChild(app)

  let pending: PendingSubmit | null = null
  let overlayVersion = 0

  const root = createRoot(app)
  const render = () => {
    attachHost()
    root.render(
      <FrictionOverlay
        key={overlayVersion}
        pending={pending}
        onSubmit={async (data) => {
          await options.onSubmit(data)
          window.setTimeout(() => {
            pending = null
            overlayVersion += 1
            render()
          }, FADE_MS)
        }}
        onDismiss={() => {
          pending = null
          overlayVersion += 1
          options.onDismiss()
          render()
        }}
      />,
    )
  }

  const observer = new MutationObserver(attachHost)
  observer.observe(document.documentElement, { childList: true })

  render()

  return {
    show(nextPending) {
      attachHost()
      pending = nextPending
      overlayVersion += 1
      render()
    },
    hide() {
      attachHost()
      pending = null
      overlayVersion += 1
      render()
    },
  }
}
