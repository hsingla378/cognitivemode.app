import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  DAY_MS,
  STALE_MS,
  activePractice,
  activeTimeMs,
  coerceState,
  createEmptyState,
  currentAttempt,
  deriveOutcome,
  dueProblems,
  finishAttempt,
  heartbeat,
  normalize,
  recordHint,
  recordSubmit,
  resumeOrHeartbeat,
  setApproach,
  topicReadiness,
  trimState,
  upcomingReviews,
  visit,
  weeklyStats,
} from '../src/practice/model.ts'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const KEY = 'leetcode:two-sum'
const ref = {
  platform: 'leetcode',
  slug: 'two-sum',
  title: 'Two Sum',
  url: 'https://leetcode.com/problems/two-sum/',
  number: '1',
  difficulty: 'Easy',
  topics: ['Arrays', 'Hashing'],
}
const t0 = new Date(2026, 10, 22, 10, 0).getTime()

// Frozen inputs make any mutation inside the model throw (ES modules run in strict mode).
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

const empty = () => deepFreeze(createEmptyState())
const visited = (at = t0) => deepFreeze(visit(empty(), ref, at))
const last = (state, key = KEY) => state.problems[key].attempts.at(-1)

function record(slug, { topics = ['Arrays'], attempts = [], review } = {}) {
  return {
    platform: 'leetcode',
    slug,
    key: `leetcode:${slug}`,
    title: slug,
    url: `https://leetcode.com/problems/${slug}/`,
    topics,
    attempts,
    ...(review ? { review } : {}),
  }
}

function finished(endedAt, outcome) {
  return {
    startedAt: endedAt - 10 * MINUTE,
    lastActiveAt: endedAt,
    activeMs: 10 * MINUTE,
    maxHintLevel: 0,
    hintRequests: 0,
    submits: 0,
    outcome,
    endedAt,
  }
}

function stateWith(...records) {
  return deepFreeze({
    version: 1,
    problems: Object.fromEntries(records.map((item) => [item.key, item])),
    activeKey: null,
  })
}

test('visit creates a record, a first attempt and the active key', () => {
  const state = visited()

  assert.equal(state.problems[KEY].title, 'Two Sum')
  assert.deepEqual(state.problems[KEY].attempts, [
    { startedAt: t0, lastActiveAt: t0, activeMs: 0, maxHintLevel: 0, hintRequests: 0, submits: 0 },
  ])
  assert.equal(state.activeKey, KEY)
})

test('pings accumulate only gaps of at most 2 minutes', () => {
  const afterMinute = deepFreeze(heartbeat(visited(), KEY, t0 + MINUTE))
  assert.equal(last(afterMinute).activeMs, MINUTE)

  const afterLongGap = heartbeat(afterMinute, KEY, t0 + 4 * MINUTE)
  assert.equal(last(afterLongGap).activeMs, MINUTE)
  assert.equal(last(afterLongGap).lastActiveAt, t0 + 4 * MINUTE)
})

test('visit refreshes metadata and keeps attempts', () => {
  const first = deepFreeze(visit(empty(), { ...ref, title: 'two-sum' }, t0))
  const second = visit(first, ref, t0 + 1000)
  assert.equal(second.problems[KEY].title, 'Two Sum')
  assert.equal(second.problems[KEY].attempts.length, 1)

  const withStatement = visit(empty(), ref, t0, 'x'.repeat(2000))
  assert.equal(withStatement.problems[KEY].statement.length, 1500)
})

test('a finished attempt is reused within 30 minutes and replaced after', () => {
  const solved = deepFreeze(finishAttempt(visited(), KEY, 'clean', t0 + 5 * MINUTE))

  assert.equal(visit(solved, ref, t0 + 20 * MINUTE).problems[KEY].attempts.length, 1)

  const later = visit(solved, ref, t0 + 36 * MINUTE)
  assert.equal(later.problems[KEY].attempts.length, 2)
  assert.equal(last(later).outcome, undefined)
})

test('normalize drops trivial stale attempts and empty records', () => {
  const state = normalize(visited(), t0 + STALE_MS + 1)
  assert.deepEqual(state.problems, {})
  assert.equal(state.activeKey, null)
})

test('normalize closes stale hinted attempts as unsolved and queues them', () => {
  const hinted = deepFreeze(recordHint(visited(), KEY, 2, t0 + MINUTE))
  const state = normalize(hinted, t0 + MINUTE + STALE_MS + 1)
  const attempt = last(state)

  assert.equal(attempt.outcome, 'unsolved')
  assert.equal(attempt.autoClosed, true)
  assert.equal(attempt.endedAt, t0 + MINUTE)
  assert.deepEqual(state.problems[KEY].review, { stage: 1, dueAt: t0 + MINUTE + 3 * DAY_MS })
})

test('normalize closes stale unhinted work as unsolved without queueing', () => {
  let state = visited()
  for (const minutes of [1, 2, 3]) state = deepFreeze(heartbeat(state, KEY, t0 + minutes * MINUTE))

  const closed = normalize(state, t0 + 3 * MINUTE + STALE_MS + 1)
  assert.equal(last(closed).outcome, 'unsolved')
  assert.equal(closed.problems[KEY].review, undefined)
})

test('activePractice follows the 90-minute window and finished attempts', () => {
  const state = visited()
  assert.equal(activePractice(state, t0 + 89 * MINUTE)?.key, KEY)
  assert.equal(activePractice(state, t0 + 91 * MINUTE), null)

  const solved = finishAttempt(state, KEY, 'clean', t0 + MINUTE)
  assert.equal(activePractice(solved, t0 + 2 * MINUTE), null)
})

test('recordHint keeps the highest level and counts requests', () => {
  let state = visited()
  for (const level of [1, 3, 2]) state = deepFreeze(recordHint(state, KEY, level, t0 + MINUTE))
  assert.equal(last(state).maxHintLevel, 3)
  assert.equal(last(state).hintRequests, 3)

  const solved = deepFreeze(finishAttempt(state, KEY, 'assisted', t0 + 2 * MINUTE))
  assert.deepEqual(recordHint(solved, KEY, 4, t0 + 3 * MINUTE), solved)
})

test('recordSubmit counts submits on the open attempt', () => {
  assert.equal(last(recordSubmit(visited(), KEY, t0 + MINUTE)).submits, 1)
})

test('heartbeat makes that problem the active one', () => {
  const refA = { ...ref, slug: 'a', url: 'https://leetcode.com/problems/a/' }
  const refB = { ...ref, slug: 'b', url: 'https://leetcode.com/problems/b/' }
  const both = deepFreeze(visit(visit(empty(), refA, t0), refB, t0 + 1000))

  assert.equal(both.activeKey, 'leetcode:b')
  assert.equal(heartbeat(both, 'leetcode:a', t0 + 2000).activeKey, 'leetcode:a')
})

test('deriveOutcome maps hint levels to outcomes', () => {
  assert.equal(deriveOutcome(0), 'clean')
  assert.equal(deriveOutcome(1), 'hinted')
  assert.equal(deriveOutcome(2), 'hinted')
  assert.equal(deriveOutcome(3), 'assisted')
  assert.equal(deriveOutcome(4), 'assisted')
})

test('hinted, assisted and unsolved finishes queue a 3-day re-solve', () => {
  for (const outcome of ['hinted', 'assisted', 'unsolved']) {
    const state = finishAttempt(visited(), KEY, outcome, t0 + MINUTE)
    assert.deepEqual(state.problems[KEY].review, { stage: 1, dueAt: t0 + MINUTE + 3 * DAY_MS }, outcome)
  }
})

function solveAt(state, outcome, at) {
  return deepFreeze(finishAttempt(visit(state, ref, at - MINUTE), KEY, outcome, at))
}

test('clean re-solves advance only when due', () => {
  const hintedAt = t0 + MINUTE
  let state = deepFreeze(finishAttempt(visited(), KEY, 'hinted', hintedAt))
  const firstDue = { stage: 1, dueAt: hintedAt + 3 * DAY_MS }

  state = solveAt(state, 'clean', hintedAt + DAY_MS)
  assert.deepEqual(state.problems[KEY].review, firstDue)

  const secondAt = hintedAt + 3 * DAY_MS - 12 * HOUR
  state = solveAt(state, 'clean', secondAt)
  assert.deepEqual(state.problems[KEY].review, { stage: 2, dueAt: secondAt + 7 * DAY_MS })

  const thirdAt = secondAt + 7 * DAY_MS
  state = solveAt(state, 'clean', thirdAt)
  assert.deepEqual(state.problems[KEY].review, { stage: 3, dueAt: thirdAt + 21 * DAY_MS })

  const fourthAt = thirdAt + 21 * DAY_MS
  state = solveAt(state, 'clean', fourthAt)
  assert.equal(state.problems[KEY].review, undefined)
  assert.equal(state.problems[KEY].graduatedAt, fourthAt)
})

test('a hinted re-solve resets the schedule to stage 1', () => {
  const hintedAt = t0 + MINUTE
  let state = deepFreeze(finishAttempt(visited(), KEY, 'hinted', hintedAt))
  const secondAt = hintedAt + 3 * DAY_MS
  state = solveAt(state, 'clean', secondAt)
  assert.equal(state.problems[KEY].review.stage, 2)

  const againAt = secondAt + 7 * DAY_MS
  state = solveAt(state, 'hinted', againAt)
  assert.deepEqual(state.problems[KEY].review, { stage: 1, dueAt: againAt + 3 * DAY_MS })
})

test('dueProblems includes reviews due by end of local today, sorted', () => {
  const now = new Date(2026, 10, 22, 12, 0).getTime()
  const tonight = record('tonight', { review: { stage: 1, dueAt: new Date(2026, 10, 22, 23, 0).getTime() } })
  const morning = record('morning', { review: { stage: 2, dueAt: new Date(2026, 10, 22, 8, 0).getTime() } })
  const tomorrow = record('tomorrow', { review: { stage: 1, dueAt: new Date(2026, 10, 23, 0, 30).getTime() } })
  const state = stateWith(tonight, morning, tomorrow, record('none'))

  assert.deepEqual(dueProblems(state, now).map((item) => item.slug), ['morning', 'tonight'])
  assert.deepEqual(upcomingReviews(state, now).map((item) => item.slug), ['tomorrow'])
})

test("topicReadiness uses each problem's latest finished outcome", () => {
  const state = stateWith(
    record('p1', { topics: ['Arrays', 'Hashing'], attempts: [finished(t0, 'hinted'), finished(t0 + DAY_MS, 'clean')] }),
    record('p2', { topics: ['Arrays'], attempts: [finished(t0, 'unsolved')] }),
    record('p3', {
      topics: ['Graphs'],
      attempts: [{ startedAt: t0, lastActiveAt: t0, activeMs: 0, maxHintLevel: 0, hintRequests: 0, submits: 0 }],
    }),
  )

  assert.deepEqual(topicReadiness(state), [
    { topic: 'Arrays', attempted: 2, clean: 1 },
    { topic: 'Hashing', attempted: 1, clean: 1 },
  ])
})

test('weeklyStats counts the last 7 days and the clean streak', () => {
  const now = new Date(2026, 10, 22, 20, 0).getTime()
  const at = (day, hour = 10) => new Date(2026, 10, day, hour, 0).getTime()
  const state = stateWith(
    record('today', { attempts: [finished(at(22, 9), 'clean')] }),
    record('yesterday', { attempts: [finished(at(21), 'clean')] }),
    record('three-days', { attempts: [finished(at(19), 'clean')] }),
    record('hinted-today', { attempts: [finished(at(22, 11), 'hinted')] }),
    record('unsolved', { attempts: [finished(at(20), 'unsolved')] }),
    record('old', { attempts: [finished(at(13), 'clean')] }),
  )

  assert.deepEqual(weeklyStats(state, now), { solved: 4, clean: 3, unsolved: 1, streakDays: 2 })
})

test('the streak counts back from yesterday when today has no clean solve', () => {
  const now = new Date(2026, 10, 22, 20, 0).getTime()
  const state = stateWith(
    record('yesterday', { attempts: [finished(new Date(2026, 10, 21, 10).getTime(), 'clean')] }),
    record('day-before', { attempts: [finished(new Date(2026, 10, 20, 10).getTime(), 'clean')] }),
  )

  assert.equal(weeklyStats(state, now).streakDays, 2)
})

test('coerceState repairs storage values', () => {
  assert.deepEqual(coerceState(undefined), createEmptyState())

  const valid = record('valid', { attempts: [finished(t0, 'clean')], review: { stage: 1, dueAt: t0 } })
  const missingAttempts = { ...record('no-attempts'), attempts: undefined }
  const badPlatform = { ...record('bad'), platform: 'codeforces', key: 'codeforces:bad' }
  const state = coerceState({
    version: 1,
    problems: {
      [valid.key]: valid,
      [missingAttempts.key]: missingAttempts,
      [badPlatform.key]: badPlatform,
    },
    activeKey: 'leetcode:missing',
  })

  assert.deepEqual(state.problems, { [valid.key]: valid })
  assert.equal(state.activeKey, null)
})

test('trimState caps attempts at 50 per problem and problems at 2000, dropping the stalest first', () => {
  const attempts = Array.from({ length: 55 }, (_, index) => finished(t0 + index * MINUTE, 'clean'))
  const trimmedAttempts = trimState(stateWith(record('busy', { attempts })))
  assert.equal(trimmedAttempts.problems['leetcode:busy'].attempts.length, 50)
  assert.equal(trimmedAttempts.problems['leetcode:busy'].attempts[0].endedAt, t0 + 5 * MINUTE)

  const many = Array.from({ length: 2001 }, (_, index) =>
    record(`p${index}`, { attempts: [finished(t0 + index * MINUTE, 'clean')] }),
  )
  const trimmedProblems = trimState(stateWith(...many))
  assert.equal(Object.keys(trimmedProblems.problems).length, 2000)
  assert.equal(trimmedProblems.problems['leetcode:p0'], undefined)
  assert.ok(trimmedProblems.problems['leetcode:p2000'])
})

test('activeTimeMs adds the live gap only when live and within 2 minutes', () => {
  const attempt = { ...last(visited()), activeMs: MINUTE }
  assert.equal(activeTimeMs(attempt, t0 + 90_000, true), MINUTE + 90_000)
  assert.equal(activeTimeMs(attempt, t0 + 3 * MINUTE, true), MINUTE)
  assert.equal(activeTimeMs(attempt, t0 + 90_000, false), MINUTE)
})

test('resumeOrHeartbeat restarts tracking after the stale rule closed the attempt', () => {
  let state = visited()
  for (const minutes of [1, 2, 3]) state = deepFreeze(heartbeat(state, KEY, t0 + minutes * MINUTE))

  const back = resumeOrHeartbeat(state, ref, t0 + 3 * MINUTE + STALE_MS + 1)
  const attempts = back.problems[KEY].attempts
  assert.equal(attempts.length, 2)
  assert.equal(attempts[0].autoClosed, true)
  assert.equal(attempts[1].outcome, undefined)
  assert.equal(activePractice(back, t0 + 3 * MINUTE + STALE_MS + 1)?.key, KEY)
})

test('resumeOrHeartbeat recreates a record dropped as trivial', () => {
  const back = resumeOrHeartbeat(visited(), ref, t0 + STALE_MS + 1)
  assert.equal(back.problems[KEY].attempts.length, 1)
  assert.equal(back.activeKey, KEY)
})

test('resumeOrHeartbeat keeps a finish the user logged closed', () => {
  const solved = deepFreeze(finishAttempt(visited(), KEY, 'clean', t0 + 5 * MINUTE))
  const later = resumeOrHeartbeat(solved, ref, t0 + 5 * MINUTE + 7 * HOUR)
  assert.equal(later.problems[KEY].attempts.length, 1)
  assert.equal(activePractice(later, t0 + 5 * MINUTE + 7 * HOUR), null)
})

test('logging the same attempt twice does not record a phantom solve', () => {
  const once = deepFreeze(finishAttempt(visited(), KEY, 'clean', t0 + MINUTE))
  const twice = finishAttempt(once, KEY, 'clean', t0 + MINUTE + 500)

  assert.deepEqual(twice, once)
  assert.equal(weeklyStats(twice, t0 + 2 * MINUTE).solved, 1)
})

test('logging after an auto-close replaces the unsolved outcome', () => {
  const hinted = deepFreeze(recordHint(visited(), KEY, 1, t0 + MINUTE))
  const closed = deepFreeze(normalize(hinted, t0 + MINUTE + STALE_MS + 1))
  const loggedAt = t0 + MINUTE + STALE_MS + 2
  const logged = finishAttempt(closed, KEY, 'hinted', loggedAt)
  const attempts = logged.problems[KEY].attempts

  assert.equal(attempts.length, 1)
  assert.equal(attempts[0].outcome, 'hinted')
  assert.equal(attempts[0].autoClosed, undefined)
  assert.deepEqual(logged.problems[KEY].review, { stage: 1, dueAt: loggedAt + 3 * DAY_MS })
})

test('visit keeps a real title and topics when a later read only has the slug fallback', () => {
  const gfg = {
    platform: 'gfg',
    slug: 'key-pair5616',
    title: 'Two Sum - Pair with Given Sum',
    url: 'https://www.geeksforgeeks.org/problems/key-pair5616/1',
    topics: ['Arrays', 'Hashing'],
  }
  const first = deepFreeze(visit(empty(), gfg, t0))
  const fallback = visit(first, { ...gfg, title: 'Key Pair5616', topics: [] }, t0 + MINUTE, undefined, {
    titleIsFallback: true,
  })

  assert.equal(fallback.problems['gfg:key-pair5616'].title, 'Two Sum - Pair with Given Sum')
  assert.deepEqual(fallback.problems['gfg:key-pair5616'].topics, ['Arrays', 'Hashing'])
})

test('setApproach stores the note on the open attempt only', () => {
  const noted = setApproach(visited(), KEY, '  use a hashmap  ', t0 + MINUTE)
  assert.equal(currentAttempt(noted.problems[KEY]).approach, 'use a hashmap')

  const solved = deepFreeze(finishAttempt(visited(), KEY, 'clean', t0 + MINUTE))
  assert.deepEqual(setApproach(solved, KEY, 'late note', t0 + 2 * MINUTE), solved)
})
