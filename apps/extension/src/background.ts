const WELCOME_URL = 'https://cognitivemode.app/welcome'

chrome.runtime.setUninstallURL('https://cognitivemode.app/goodbye')

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    void chrome.tabs.create({ url: WELCOME_URL })
  }
})
