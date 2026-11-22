import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'

const HOUR = 60 * 60_000
const ref = (slug) => ({
  platform: 'leetcode',
  slug,
  title: slug,
  url: `https://leetcode.com/problems/${slug}/`,
  topics: [],
})

// In-memory stand-in for chrome.storage with the MV3 promise API.
function installFakeChrome(initial = {}) {
  const data = structuredClone(initial)
  const listeners = new Set()
  const fake = { data, writes: 0 }

  globalThis.chrome = {
    storage: {
      local: {
        async get(key) {
          await Promise.resolve()
          return key in data ? { [key]: structuredClone(data[key]) } : {}
        },
        async set(values) {
          await Promise.resolve()
          fake.writes += 1
          Object.assign(data, structuredClone(values))
          const changes = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { newValue: value }]))
          for (const listener of listeners) listener(changes, 'local')
        },
      },
      onChanged: {
        addListener: (listener) => listeners.add(listener),
        removeListener: (listener) => listeners.delete(listener),
      },
    },
  }
  return fake
}

const { PRACTICE_STATE_KEY, onPracticeStateChange, readPracticeState, updatePracticeState } = await import(
  '../src/practice/store.ts'
)
const { createEmptyState, visit } = await import('../src/practice/model.ts')

beforeEach(() => installFakeChrome())

test('readPracticeState returns an empty state for empty storage', async () => {
  assert.deepEqual(await readPracticeState(), createEmptyState())
})

test('updatePracticeState serializes concurrent updates in one tab', async () => {
  await Promise.all([
    updatePracticeState((state, now) => visit(state, ref('a'), now)),
    updatePracticeState((state, now) => visit(state, ref('b'), now)),
  ])

  const state = await readPracticeState()
  assert.deepEqual(Object.keys(state.problems).sort(), ['leetcode:a', 'leetcode:b'])
})

test('updatePracticeState writes the normalized state', async () => {
  const stale = Date.now() - 7 * HOUR
  const fake = installFakeChrome({ [PRACTICE_STATE_KEY]: visit(createEmptyState(), ref('old'), stale) })

  await updatePracticeState((state) => state)

  assert.deepEqual(fake.data[PRACTICE_STATE_KEY].problems, {})
})

test('updatePracticeState skips the write when nothing changed', async () => {
  const fake = installFakeChrome({ [PRACTICE_STATE_KEY]: visit(createEmptyState(), ref('a'), Date.now()) })

  await updatePracticeState((state) => state)

  assert.equal(fake.writes, 0)
})

test('onPracticeStateChange delivers coerced states', async () => {
  const received = []
  const unsubscribe = onPracticeStateChange((state) => received.push(state))

  await updatePracticeState((state, now) => visit(state, ref('a'), now))
  unsubscribe()
  await updatePracticeState((state, now) => visit(state, ref('b'), now))

  assert.equal(received.length, 1)
  assert.deepEqual(Object.keys(received[0].problems), ['leetcode:a'])
})
