import styles from './content.css?inline'

export interface ShadowHost {
  /** Container inside the shadow root to render React into. */
  app: HTMLElement
  destroy: () => void
}

// Keys typed into our UI must not reach the page, or chat apps that focus their composer on
// any keypress would steal the text. Window-level capture handlers still run first.
function stopKeyEvents(host: HTMLElement): void {
  for (const type of ['keydown', 'keypress', 'keyup']) {
    host.addEventListener(type, (event) => event.stopPropagation())
  }
}

/** A style-isolated root attached to <html>, re-attached if the page's framework removes it. */
export function createShadowHost(id: string, hostCss: string): ShadowHost {
  document.getElementById(id)?.remove()

  const host = document.createElement('div')
  host.id = id
  host.style.cssText = hostCss
  stopKeyEvents(host)

  const attach = () => {
    if (host.parentElement !== document.documentElement) document.documentElement.appendChild(host)
  }
  attach()

  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = styles
  shadow.appendChild(style)

  const app = document.createElement('div')
  app.id = 'cognitive-mode-app'
  shadow.appendChild(app)

  const observer = new MutationObserver(attach)
  observer.observe(document.documentElement, { childList: true })

  return {
    app,
    destroy() {
      observer.disconnect()
      host.remove()
    },
  }
}
