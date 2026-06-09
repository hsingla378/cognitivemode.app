function init() {
  console.debug('[Cognitive Mode] content script loaded')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
