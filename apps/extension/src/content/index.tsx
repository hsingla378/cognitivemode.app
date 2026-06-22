import { initInterceptor } from './interceptor'
import { mountOverlay } from './mount'
import { saveCognitiveLog } from './storage'
import type { PendingSubmit } from './types'

let pendingSubmit: PendingSubmit | null = null

const EXTENSION_META_NAME = 'cognitivemode-extension'
const EXTENSION_READY_EVENT = 'cognitivemode:ready'

function isLandingPage(): boolean {
  const { hostname } = window.location
  return hostname === 'cognitivemode.app' || hostname === 'localhost'
}

function injectExtensionMetaTag(): void {
  if (document.querySelector(`meta[name="${EXTENSION_META_NAME}"]`)) return

  const meta = document.createElement('meta')
  meta.name = EXTENSION_META_NAME
  meta.content = 'installed'
  document.head.appendChild(meta)
}

function dispatchExtensionReadyEvent(): void {
  window.dispatchEvent(new CustomEvent(EXTENSION_READY_EVENT))
}

function init() {
  if (isLandingPage()) {
    injectExtensionMetaTag()
    dispatchExtensionReadyEvent()
    console.debug('[Cognitive Mode] extension handshake active')
    return
  }

  const overlay = mountOverlay({
    async onSubmit({ hypothesis, tried, durationSeconds }) {
      const submit = pendingSubmit
      pendingSubmit = null

      await saveCognitiveLog(hypothesis, tried, durationSeconds)
      interceptor.unlock(submit?.trigger)
    },
    onDismiss() {
      pendingSubmit = null
      interceptor.releaseIntercept()
    },
  })

  const interceptor = initInterceptor((pending) => {
    pendingSubmit = pending
    overlay.show(pending)
  })

  console.debug('[Cognitive Mode] content script active')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
