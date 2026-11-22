import assert from 'node:assert/strict'
import { register } from 'node:module'
import { afterEach, test } from 'node:test'

register('./helpers/runtime-hooks.mjs', import.meta.url)

const SETTINGS = { countdownDuration: 15, enabled: true, practiceMode: true, everydayMode: false }
const TWO_SUM = 'leetcode:two-sum'
const settle = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

let href
let storage
let docListeners
let stopRuntime

// Just enough of chrome.storage, window and document for the runtime; pages have no
// readable metadata, so titles fall back to the URL slug.
function installEnvironment({ visibility = 'visible', practice } = {}) {
  href = 'https://leetcode.com/problems/two-sum/description/'
  storage = { cognitive_settings: { ...SETTINGS }, ...(practice ? { cm_practice_v1: practice } : {}) }
  docListeners = {}
  globalThis.__pillLog = []
  const changeListeners = new Set()

  globalThis.chrome = {
    storage: {
      local: {
        async get(key) {
          return key in storage ? { [key]: structuredClone(storage[key]) } : {}
        },
        async set(values) {
          Object.assign(storage, structuredClone(values))
          const changes = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { newValue: value }]))
          for (const listener of changeListeners) listener(changes, 'local')
        },
      },
      onChanged: {
        addListener: (listener) => changeListeners.add(listener),
        removeListener: (listener) => changeListeners.delete(listener),
      },
    },
  }
  globalThis.window = {
    location: {
      get href() {
        return href
      },
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    addEventListener() {},
    removeEventListener() {},
  }
  globalThis.document = {
    visibilityState: visibility,
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (type, listener) => {
      docListeners[type] = listener
    },
    removeEventListener() {},
  }
  globalThis.Element = class {}
}

const { initPracticeRuntime } = await import('../src/practice/runtime.ts')

afterEach(() => {
  stopRuntime?.()
  stopRuntime = undefined
})

test('pausing removes the pill', async () => {
  installEnvironment()
  stopRuntime = initPracticeRuntime()
  await settle()
  assert.ok(globalThis.__pillLog.some((event) => event.type === 'update' && event.key === TWO_SUM))

  globalThis.__pillLog.length = 0
  await chrome.storage.local.set({ cognitive_settings: { ...SETTINGS, enabled: false } })
  await settle(50)

  assert.ok(globalThis.__pillLog.some((event) => event.type === 'destroy'))
})

test('a problem opened in a background tab waits until the tab is visible', async () => {
  installEnvironment({ visibility: 'hidden' })
  stopRuntime = initPracticeRuntime()
  await settle()
  assert.equal(storage.cm_practice_v1?.problems?.[TWO_SUM], undefined)

  document.visibilityState = 'visible'
  docListeners.visibilitychange()
  await settle(100)

  assert.equal(storage.cm_practice_v1.activeKey, TWO_SUM)
  assert.equal(storage.cm_practice_v1.problems[TWO_SUM].attempts.length, 1)
})

test('returning to a tab after the stale rule restarts tracking', async () => {
  installEnvironment()
  stopRuntime = initPracticeRuntime()
  await settle()

  // An overnight gap: the open attempt's last activity was 7 hours ago, after a hint.
  const state = structuredClone(storage.cm_practice_v1)
  const sevenHoursAgo = Date.now() - 7 * 60 * 60_000
  Object.assign(state.problems[TWO_SUM].attempts.at(-1), {
    startedAt: sevenHoursAgo - 600_000,
    lastActiveAt: sevenHoursAgo,
    activeMs: 600_000,
    maxHintLevel: 2,
    hintRequests: 1,
  })
  await chrome.storage.local.set({ cm_practice_v1: state })

  docListeners.visibilitychange()
  await settle(100)

  const attempts = storage.cm_practice_v1.problems[TWO_SUM].attempts
  assert.equal(attempts.length, 2)
  assert.equal(attempts[0].outcome, 'unsolved')
  assert.equal(attempts[0].autoClosed, true)
  assert.equal(attempts[1].outcome, undefined)
})

test('the submit prompt stays with the problem it was submitted on', async () => {
  installEnvironment()
  stopRuntime = initPracticeRuntime()
  await settle()

  const submitButton = new globalThis.Element()
  submitButton.closest = (selector) => (selector.includes('console-submit-button') ? submitButton : null)
  docListeners.click({ target: submitButton })

  // The user clicks "Next" before the 4-second prompt fires.
  href = 'https://leetcode.com/problems/add-two-numbers/description/'
  await settle(1300)
  globalThis.__pillLog.length = 0
  await settle(3200)

  const nextProblemUpdates = globalThis.__pillLog.filter(
    (event) => event.type === 'update' && event.key === 'leetcode:add-two-numbers',
  )
  assert.ok(nextProblemUpdates.length > 0)
  assert.ok(nextProblemUpdates.every((event) => event.autoOpenToken === 0))
})
