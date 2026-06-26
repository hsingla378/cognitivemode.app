import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

async function loadStorageModule() {
  const source = readFileSync(
    new URL('../src/content/storage.ts', import.meta.url),
    'utf8',
  )
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText

  return import(`data:text/javascript,${encodeURIComponent(transpiled)}`)
}

test('self-solved stats initialize with the requested schema', async () => {
  const { createDefaultSelfSolvedStats } = await loadStorageModule()

  assert.deepEqual(createDefaultSelfSolvedStats(), {
    totalGatesTriggered: 0,
    totalSelfSolved: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastSelfSolvedDate: '',
    selfSolvedHistory: [],
  })
})

test('self-solved stats update totals, history, and streaks', async () => {
  const { createDefaultSelfSolvedStats, updateSelfSolvedStats } = await loadStorageModule()
  const event = {
    date: '2026-06-27',
    domain: 'chatgpt.com',
    hypothesis: 'The cache key is stale',
  }

  const first = updateSelfSolvedStats(createDefaultSelfSolvedStats(), event)
  assert.equal(first.totalSelfSolved, 1)
  assert.equal(first.currentStreak, 1)
  assert.equal(first.longestStreak, 1)
  assert.equal(first.lastSelfSolvedDate, '2026-06-27')
  assert.deepEqual(first.selfSolvedHistory, [event])

  const sameDay = updateSelfSolvedStats(first, {
    ...event,
    hypothesis: 'The retry branch is skipped',
  })
  assert.equal(sameDay.totalSelfSolved, 2)
  assert.equal(sameDay.currentStreak, 1)
  assert.equal(sameDay.longestStreak, 1)

  const nextDay = updateSelfSolvedStats(sameDay, {
    ...event,
    date: '2026-06-28',
  })
  assert.equal(nextDay.currentStreak, 2)
  assert.equal(nextDay.longestStreak, 2)

  const afterGap = updateSelfSolvedStats(nextDay, {
    ...event,
    date: '2026-07-01',
  })
  assert.equal(afterGap.currentStreak, 1)
  assert.equal(afterGap.longestStreak, 2)
})
