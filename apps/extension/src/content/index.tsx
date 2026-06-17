import { initInterceptor } from './interceptor'
import { mountOverlay } from './mount'
import { saveCognitiveLog } from './storage'
import type { PendingSubmit } from './types'

let pendingSubmit: PendingSubmit | null = null

function init() {
  const overlay = mountOverlay({
    async onSubmit({ hypothesis, tried }) {
      const submit = pendingSubmit
      pendingSubmit = null

      await saveCognitiveLog(hypothesis, tried)
      interceptor.unlock(submit?.trigger)
    },
    onDismiss() {
      pendingSubmit = null
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
