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

/**
 * A style-isolated root attached to <html>, re-attached if the page's framework removes it.
 *
 * Ad blockers ship generic cosmetic filters such as `head ~ div[style*="z-index"]` that hid a
 * plain div host in testing. So the host is a custom element with no inline style, and its
 * positioning lives in `:host` inside the shadow root, where !important outranks the page's
 * !important rules.
 */
export function createShadowHost(tagName: string, hostCss: string): ShadowHost {
  document.querySelector(tagName)?.remove()

  const host = document.createElement(tagName)
  stopKeyEvents(host)

  const attach = () => {
    if (host.parentElement !== document.documentElement) document.documentElement.appendChild(host)
  }
  attach()

  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = `:host { ${hostCss} }\n${styles}`
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
