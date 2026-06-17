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
  host.style.all = 'initial'
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = styles
  shadow.appendChild(style)

  const app = document.createElement('div')
  app.id = 'cognitive-mode-app'
  shadow.appendChild(app)

  let pending: PendingSubmit | null = null

  const root = createRoot(app)
  const render = () => {
    root.render(
      <FrictionOverlay
        pending={pending}
        onSubmit={async (data) => {
          await options.onSubmit(data)
          window.setTimeout(() => {
            pending = null
            render()
          }, FADE_MS)
        }}
        onDismiss={() => {
          pending = null
          options.onDismiss()
          render()
        }}
      />,
    )
  }

  render()

  return {
    show(nextPending) {
      pending = nextPending
      render()
    },
    hide() {
      pending = null
      render()
    },
  }
}
