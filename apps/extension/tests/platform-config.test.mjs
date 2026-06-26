import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

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

test('manifest host permissions are scoped to the supported AI tools', () => {
  assert.deepEqual(manifestUrlsFor('host_permissions'), [
    'https://chatgpt.com/*',
    'https://claude.ai/*',
    'https://v0.dev/*',
    'https://bolt.new/*',
    'https://gemini.google.com/*',
    'https://cursor.com/*',
    'https://windsurf.com/*',
    'https://perplexity.ai/*',
  ])
  assert.doesNotMatch(JSON.stringify(manifest), /<all_urls>|https:\/\/\*\/\*/)
})

test('manifest content scripts include AI tools and web handshake surfaces', () => {
  const supportedToolPatterns = manifestUrlsFor('host_permissions')

  assert.deepEqual(manifest.content_scripts[0].matches, [
    ...supportedToolPatterns,
    'https://cognitivemode.app/*',
    'http://localhost/*',
  ])
})

test('manifest web-accessible resources stay scoped to supported AI tools', () => {
  const supportedToolPatterns = manifestUrlsFor('host_permissions')

  assert.deepEqual(manifest.web_accessible_resources[0].matches, supportedToolPatterns)
})

test('interceptor has platform selectors for current v0.dev and Bolt composers', () => {
  assert.match(interceptorSource, /'v0\.dev'/)
  assert.match(interceptorSource, /textarea\[placeholder\*="help you today" i\]/)
  assert.match(interceptorSource, /button\[aria-label\*="send" i\]/)
})

test('interceptor has platform selectors for Cursor, Windsurf, and Perplexity composers', () => {
  assert.match(interceptorSource, /'cursor\.com'/)
  assert.match(interceptorSource, /'windsurf\.com'/)
  assert.match(interceptorSource, /'perplexity\.ai'/)
  assert.match(interceptorSource, /div\[contenteditable="true"\]\[role="textbox"\]/)
  assert.match(interceptorSource, /textarea\[placeholder\*="Ask" i\]/)
  assert.match(interceptorSource, /button\[aria-label\*="Submit" i\]/)
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

test('storage helpers tolerate stale content scripts after extension reloads', () => {
  assert.match(storageSource, /function isExtensionContextInvalidated/)
  assert.match(storageSource, /Extension context invalidated/)
  assert.match(storageSource, /async function safeStorageGet/)
  assert.match(storageSource, /async function safeStorageSet/)
  assert.match(storageSource, /return fallback/)
})

test('package script rebuilds a fresh Chrome Web Store zip from dist contents', () => {
  assert.match(extensionPackage.scripts.package, /npm run build/)
  assert.match(extensionPackage.scripts.package, /rm -f cognitivemode-release\.zip/)
  assert.match(extensionPackage.scripts.package, /cd dist/)
  assert.match(extensionPackage.scripts.package, /zip -r \.\.\/cognitivemode-release\.zip \.\//)
})
