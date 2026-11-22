import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { platformSelectors, resolvePlatform } from '../src/content/interceptor.ts'

const manifest = JSON.parse(
  readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'),
)
const extensionPackage = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)
const interceptorSource = readFileSync(
  new URL('../src/content/interceptor.ts', import.meta.url),
  'utf8',
)
const storageSource = readFileSync(
  new URL('../src/content/storage.ts', import.meta.url),
  'utf8',
)
const backgroundSource = readFileSync(
  new URL('../src/background.ts', import.meta.url),
  'utf8',
)

function manifestUrlsFor(key) {
  return manifest[key] ?? []
}

test('manifest host permissions are the AI and practice hosts', () => {
  assert.deepEqual(manifestUrlsFor('host_permissions'), [
    'https://chatgpt.com/*',
    'https://claude.ai/*',
    'https://gemini.google.com/*',
    'https://perplexity.ai/*',
    'https://www.perplexity.ai/*',
    'https://chat.deepseek.com/*',
    'https://v0.app/*',
    'https://v0.dev/*',
    'https://bolt.new/*',
    'https://leetcode.com/*',
    'https://www.geeksforgeeks.org/*',
    'https://takeuforward.org/*',
  ])
  assert.doesNotMatch(JSON.stringify(manifest), /<all_urls>|https:\/\/\*\/\*/)
})

test('content scripts also cover the landing page handshake', () => {
  assert.deepEqual(manifest.content_scripts[0].matches, [
    ...manifestUrlsFor('host_permissions'),
    'https://cognitivemode.app/*',
    'http://localhost/*',
  ])
})

test('manifest exposes no web-accessible resources', () => {
  // Nothing in the content script loads extension files, and exposing them would let
  // practice sites detect the extension.
  assert.equal(manifest.web_accessible_resources, undefined)
})

test('the hint ladder only runs on chat AIs', () => {
  for (const host of ['chatgpt.com', 'claude.ai', 'gemini.google.com', 'perplexity.ai', 'chat.deepseek.com']) {
    assert.equal(platformSelectors[host].hintLadder, true, host)
  }
  for (const host of ['v0.app', 'v0.dev', 'bolt.new']) {
    assert.notEqual(platformSelectors[host].hintLadder, true, host)
  }
})

test('background re-runs the idempotent settings migration on browser start', () => {
  assert.match(backgroundSource, /function onBrowserStart\(\)[\s\S]*?migrateSettings\(\)/)
  assert.match(backgroundSource, /chrome\.runtime\.onStartup\.addListener\(onBrowserStart\)/)
})

test('manifest is version 0.3.0 with storage and alarms only', () => {
  assert.equal(manifest.name, 'Cognitive Mode: AI hints for DSA practice')
  assert.ok(manifest.name.length <= 75)
  assert.equal(manifest.action.default_title, 'Cognitive Mode')
  assert.equal(manifest.version, '0.3.0')
  assert.equal(extensionPackage.version, '0.3.0')
  assert.deepEqual(manifest.permissions, ['storage', 'alarms'])
  assert.equal(
    manifest.description,
    'Practice coding problems with AI hints, not answers. Tracks clean solves and brings problems back for a re-solve.',
  )
  assert.ok(manifest.description.length <= 132)
})

test('selectors target the current ChatGPT composer', () => {
  assert.ok(platformSelectors['chatgpt.com'].input.includes('div.ProseMirror[contenteditable="true"]'))
  assert.ok(platformSelectors['chatgpt.com'].button.includes('button[type="submit"][aria-label="Send" i]'))
})

test('Perplexity send selector targets Submit, not the Search mode toggle', () => {
  // Live test: querySelector returned the "Search" toggle (earlier in the DOM) instead of Submit.
  const { button } = platformSelectors['perplexity.ai']
  assert.ok(button.includes('button[aria-label="Submit" i]'))
  assert.doesNotMatch(button, /Search/i)
})

test('Claude send button match is case-insensitive', () => {
  assert.ok(platformSelectors['claude.ai'].button.includes('aria-label="Send message" i'))
})

test('DeepSeek is supported and desktop-IDE sites are not', () => {
  assert.notEqual(resolvePlatform('chat.deepseek.com'), null)
  assert.notEqual(resolvePlatform('v0.app'), null)
  assert.notEqual(resolvePlatform('www.perplexity.ai'), null)
  assert.equal(resolvePlatform('cursor.com'), null)
  assert.equal(resolvePlatform('windsurf.com'), null)
})

test('interceptor keeps selectors for v0 and Bolt composers', () => {
  assert.match(interceptorSource, /'v0\.dev'/)
  assert.match(interceptorSource, /textarea\[placeholder\*="help you today" i\]/)
  assert.match(interceptorSource, /button\[aria-label\*="send" i\]/)
})

test('pending submit re-resolves the send button after the overlay delay', () => {
  const createPendingSubmitSource = interceptorSource.match(
    /function createPendingSubmit[\s\S]*?\n}\n\nconst noopHandle/,
  )?.[0]

  assert.ok(createPendingSubmitSource, 'Expected createPendingSubmit implementation')
  assert.doesNotMatch(
    createPendingSubmitSource,
    /const sendButton = findSendButton\(input, buttonSelector\)\n\n\s*return \{/,
  )
  assert.match(
    createPendingSubmitSource,
    /trigger:\s*\(\) => \{\s*const sendButton = findSendButton\(input, buttonSelector\)/,
  )
  assert.match(createPendingSubmitSource, /sendButton\.isConnected/)
  assert.match(createPendingSubmitSource, /isVisible\(sendButton\)/)
})

test('interceptor always relocks after replaying a pending submit', () => {
  const unlockSource = interceptorSource.match(
    /const unlock = \(submit\?: \(\) => void\) => \{[\s\S]*?\n  \}/,
  )?.[0]

  assert.ok(unlockSource, 'Expected unlock implementation')
  assert.match(unlockSource, /try \{[\s\S]*submit\?\.\(\)/)
  assert.match(unlockSource, /finally \{[\s\S]*window\.setTimeout/)
  assert.match(unlockSource, /isUnlocked = false/)
})

test('overlay escape trap stops later page key handlers on the same target', () => {
  const overlaySource = readFileSync(
    new URL('../src/content/Overlay.tsx', import.meta.url),
    'utf8',
  )

  assert.match(overlaySource, /e\.key === 'Escape'/)
  assert.match(overlaySource, /e\.stopImmediatePropagation\(\)/)
})

test('background service worker sends uninstalls to the feedback page', () => {
  assert.match(
    backgroundSource,
    /chrome\.runtime\.setUninstallURL\('https:\/\/cognitivemode\.app\/goodbye'\)/,
  )
})

test('injected UI hosts dodge generic ad-block cosmetic filters', () => {
  const shadowHostSource = readFileSync(new URL('../src/content/shadowHost.ts', import.meta.url), 'utf8')
  const overlaySource = readFileSync(new URL('../src/content/mount.tsx', import.meta.url), 'utf8')
  const pillSource = readFileSync(new URL('../src/practice/mountPill.tsx', import.meta.url), 'utf8')

  // Filters like `head ~ div[style*="z-index"]` (Stands) hid both hosts in live testing.
  // Hosts are custom elements with no inline style; positioning lives in :host inside the
  // shadow root, where !important beats the page's !important.
  assert.doesNotMatch(shadowHostSource, /style\.cssText|createElement\('div'\)\s*\n\s*host/)
  assert.match(shadowHostSource, /:host \{/)
  assert.match(overlaySource, /createShadowHost\('cognitive-mode-overlay'/)
  assert.match(pillSource, /createShadowHost\('cognitive-mode-pill'/)
  for (const source of [overlaySource, pillSource]) {
    assert.match(source, /display: block !important/)
    assert.match(source, /visibility: visible !important/)
  }
})

test('background migrates settings on update', () => {
  assert.match(backgroundSource, /migrateSettingsOnUpdate/)
})

test('background keeps a due-count badge', () => {
  assert.match(backgroundSource, /setBadgeText/)
  assert.match(backgroundSource, /periodInMinutes:\s*60/)
})

test('storage helpers tolerate stale content scripts after extension reloads', () => {
  assert.match(storageSource, /function isExtensionContextInvalidated/)
  assert.match(storageSource, /Extension context invalidated/)
  assert.match(storageSource, /async function safeStorageGet/)
  assert.match(storageSource, /async function safeStorageSet/)
  assert.match(storageSource, /return fallback/)
})

test('overlay exposes a self-solved action after the gate unlocks', () => {
  const overlaySource = readFileSync(
    new URL('../src/content/Overlay.tsx', import.meta.url),
    'utf8',
  )

  assert.match(overlaySource, /onSelfSolved/)
  assert.match(overlaySource, /handleSelfSolved/)
  assert.match(overlaySource, /I figured it out/)
})

test('overlay requires detailed 40-character gate responses', () => {
  const overlaySource = readFileSync(
    new URL('../src/content/Overlay.tsx', import.meta.url),
    'utf8',
  )

  assert.match(overlaySource, /const MIN_CHARS = 40/)
  assert.match(
    overlaySource,
    /placeholder="e\.g\. I think the bug is in the useEffect cleanup, because it only happens on unmount"/,
  )
  assert.match(
    overlaySource,
    /placeholder="e\.g\. Added console logs, checked the network tab, tried removing the dependency array"/,
  )
  assert.match(overlaySource, /\{hypothesis\.trim\(\)\.length\}\/\{MIN_CHARS\} chars/)
  assert.match(overlaySource, /\{tried\.trim\(\)\.length\}\/\{MIN_CHARS\} chars/)
})

test('overlay collapsed textareas fit multi-line placeholders', () => {
  const overlaySource = readFileSync(
    new URL('../src/content/Overlay.tsx', import.meta.url),
    'utf8',
  )

  assert.match(overlaySource, /expanded \? 'h-28 overflow-y-auto' : 'h-24 overflow-y-hidden'/)
  assert.doesNotMatch(overlaySource, /expanded \? 'h-28 overflow-y-auto' : 'h-11 overflow-hidden'/)
})

test('popup shows practice data and settings', () => {
  const popupSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

  for (const name of ['activePractice', 'dueProblems', 'weeklyStats', 'topicReadiness']) {
    assert.match(popupSource, new RegExp(name), name)
  }
  assert.match(popupSource, /Re-solve today/)
  assert.match(popupSource, /Practice mode/)
  assert.match(popupSource, /Everyday mode/)
})

test('popup is 360 by 560', () => {
  const popupSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const popupCss = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(popupSource, /h-\[560px\] w-\[360px\]/)
  assert.match(popupCss, /width:\s*360px/)
  assert.match(popupCss, /height:\s*560px/)
})

test('dashboard has practice log, re-solve, topics and notes tabs', () => {
  const dashboardSource = readFileSync(new URL('../src/History.tsx', import.meta.url), 'utf8')
  const dashboardHtml = readFileSync(new URL('../history.html', import.meta.url), 'utf8')

  for (const label of ['Practice log', 'Re-solve', 'Topics', 'Notes']) {
    assert.ok(dashboardSource.includes(`'${label}'`), label)
  }
  assert.match(dashboardHtml, /<title>Dashboard · Cognitive Mode<\/title>/)
})

test('package script rebuilds a fresh Chrome Web Store zip from dist contents', () => {
  assert.match(extensionPackage.scripts.package, /npm run build/)
  assert.match(extensionPackage.scripts.package, /rm -f cognitivemode-release\.zip/)
  assert.match(extensionPackage.scripts.package, /cd dist/)
  assert.match(extensionPackage.scripts.package, /zip -r \.\.\/cognitivemode-release\.zip \.\//)
})
