import { initInterceptor } from './interceptor'
import { mountOverlay } from './mount'
import { saveEntry } from './storage'
import type { PendingSubmit } from './types'

let pendingSubmit: PendingSubmit | null = null

function init() {
  const overlay = mountOverlay({
    async onSubmit({ hypothesis, tried }) {
      await saveEntry(hypothesis, tried)
      pendingSubmit?.trigger()
      pendingSubmit = null
    },
    onDismiss() {
      pendingSubmit = null
    },
  })

  initInterceptor((pending) => {
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
