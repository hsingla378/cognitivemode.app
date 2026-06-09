import { createRoot } from 'react-dom/client'
import Overlay from './Overlay'
import styles from './content.css?inline'
import type { OverlayController, PendingSubmit } from './types'

const HOST_ID = 'cognitive-mode-root'

interface MountOptions {
  onUnlock: (hypothesis: string, tried: string) => Promise<void>
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
      <Overlay
        pending={pending}
        onUnlock={async (hypothesis, tried) => {
          await options.onUnlock(hypothesis, tried)
          pending = null
          render()
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
