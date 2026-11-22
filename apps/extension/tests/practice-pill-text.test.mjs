import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DAY_MS } from '../src/practice/model.ts'
import { LOG_OPTIONS, formatClock, hintSummary, loggedMessage } from '../src/practice/pillText.ts'

const now = new Date(2026, 10, 22, 10, 0).getTime()
const base = {
  platform: 'leetcode',
  slug: 'two-sum',
  key: 'leetcode:two-sum',
  title: 'Two Sum',
  url: 'https://leetcode.com/problems/two-sum/',
  topics: [],
  attempts: [],
}

test('formatClock shows minutes and seconds, adding hours when needed', () => {
  assert.equal(formatClock(0), '00:00')
  assert.equal(formatClock(65_000), '01:05')
  assert.equal(formatClock(3_725_000), '1:02:05')
})

test('hintSummary describes the most help used so far', () => {
  assert.equal(hintSummary(0), 'no hints yet')
  assert.equal(hintSummary(1), 'used a hint')
  assert.equal(hintSummary(2), 'used a hint')
  assert.equal(hintSummary(3), 'used an outline')
  assert.equal(hintSummary(4), 'saw the solution')
})

test('log options map coach-toned labels to outcomes', () => {
  assert.deepEqual(
    LOG_OPTIONS.map((option) => [option.outcome, option.label]),
    [
      ['clean', 'Solved clean'],
      ['hinted', 'Solved with hints'],
      ['assisted', 'Needed the solution'],
      ['unsolved', "Didn't solve"],
    ],
  )
})

test('loggedMessage tells the user when the problem comes back', () => {
  assert.equal(
    loggedMessage({ ...base, review: { stage: 1, dueAt: now + 3 * DAY_MS } }, now),
    'Logged · back in 3 days for a clean re-solve',
  )
  assert.equal(loggedMessage({ ...base, graduatedAt: now }, now), 'Logged · this one is locked in')
  assert.equal(loggedMessage(base, now), 'Logged')
})
