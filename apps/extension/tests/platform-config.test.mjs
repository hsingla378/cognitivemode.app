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
const contentEntrySource = readFileSync(
  new URL('../src/content/index.tsx', import.meta.url),
  'utf8',
)

function manifestUrlsFor(key) {
  return manifest[key] ?? []
}

test('manifest registers v0.app everywhere the content script needs it', () => {
  const v0AppPattern = 'https://v0.app/*'

  assert.ok(manifestUrlsFor('host_permissions').includes(v0AppPattern))
  assert.ok(manifest.content_scripts[0].matches.includes(v0AppPattern))
  assert.ok(manifest.web_accessible_resources[0].matches.includes(v0AppPattern))
})

test('interceptor has platform selectors for current v0.app and Bolt composers', () => {
  assert.match(interceptorSource, /'v0\.app'/)
  assert.match(interceptorSource, /textarea\[placeholder\*="help you today" i\]/)
  assert.match(interceptorSource, /button\[aria-label\*="send" i\]/)
})

test('content script exposes extension presence to the web app hosts', () => {
  const localhostPattern = 'http://localhost/*'

  assert.ok(manifestUrlsFor('host_permissions').includes(localhostPattern))
  assert.ok(manifest.content_scripts[0].matches.includes(localhostPattern))
  assert.match(contentEntrySource, /hostname === 'cognitivemode\.app'/)
  assert.match(contentEntrySource, /hostname === 'localhost'/)
  assert.match(contentEntrySource, /const EXTENSION_META_NAME = 'cognitivemode-extension'/)
  assert.match(contentEntrySource, /meta\.name = EXTENSION_META_NAME/)
  assert.match(contentEntrySource, /meta\.content = 'installed'/)
  assert.match(contentEntrySource, /cognitivemode:ready/)
})

test('package script rebuilds a fresh Chrome Web Store zip from dist contents', () => {
  assert.match(extensionPackage.scripts.package, /npm run build/)
  assert.match(extensionPackage.scripts.package, /rm -f cognitivemode-release\.zip/)
  assert.match(extensionPackage.scripts.package, /cd dist/)
  assert.match(extensionPackage.scripts.package, /zip -r \.\.\/cognitivemode-release\.zip \.\//)
})
