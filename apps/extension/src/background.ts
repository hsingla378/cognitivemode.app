const WELCOME_URL = 'https://cognitivemode.app/welcome'

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    void chrome.tabs.create({ url: WELCOME_URL })
  }
})
