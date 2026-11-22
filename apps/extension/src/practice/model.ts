import { normalizeTopics } from './topics.ts'
import type {
  Attempt,
  HintLevel,
  HintRequestLevel,
  Outcome,
  Platform,
  PracticeState,
  ProblemRecord,
  ProblemRef,
  Review,
  TopicReadiness,
  WeeklyStats,
} from './types.ts'

export const ACTIVE_GAP_MS = 2 * 60_000
export const STALE_MS = 6 * 60 * 60_000
export const ACTIVE_WINDOW_MS = 90 * 60_000
export const RESTART_AFTER_FINISH_MS = 30 * 60_000
export const TRIVIAL_ACTIVE_MS = 2 * 60_000
export const DAY_MS = 24 * 60 * 60_000
export const REVIEW_INTERVAL_DAYS = [3, 7, 21] as const
export const DUE_EARLY_WINDOW_MS = 12 * 60 * 60_000
export const MAX_ATTEMPTS_PER_PROBLEM = 50
export const MAX_PROBLEMS = 2000
export const MAX_STATEMENT_CHARS = 1500

const PLATFORMS: readonly Platform[] = ['leetcode', 'gfg', 'tuf']
const OUTCOMES: readonly Outcome[] = ['clean', 'hinted', 'assisted', 'unsolved']

export function createEmptyState(): PracticeState {
  return { version: 1, problems: {}, activeKey: null }
}

export function problemKey(platform: Platform, slug: string): string {
  return `${platform}:${slug}`
}

export function currentAttempt(record: ProblemRecord): Attempt | undefined {
  const last = record.attempts.at(-1)
  return last && last.outcome === undefined ? last : undefined
}

export function latestFinished(record: ProblemRecord): Attempt | undefined {
  for (let index = record.attempts.length - 1; index >= 0; index -= 1) {
    if (record.attempts[index].outcome !== undefined) return record.attempts[index]
  }
  return undefined
}

function newAttempt(now: number): Attempt {
  return { startedAt: now, lastActiveAt: now, activeMs: 0, maxHintLevel: 0, hintRequests: 0, submits: 0 }
}

/** Activity ping: gaps of at most ACTIVE_GAP_MS count as time spent on the problem. */
export function ping(attempt: Attempt, now: number): Attempt {
  const gap = now - attempt.lastActiveAt
  return {
    ...attempt,
    activeMs: gap > 0 && gap <= ACTIVE_GAP_MS ? attempt.activeMs + gap : attempt.activeMs,
    lastActiveAt: Math.max(attempt.lastActiveAt, now),
  }
}

export function activeTimeMs(attempt: Attempt, now: number, live: boolean): number {
  const gap = now - attempt.lastActiveAt
  const counting = live && attempt.outcome === undefined && gap > 0 && gap <= ACTIVE_GAP_MS
  return counting ? attempt.activeMs + gap : attempt.activeMs
}

function replaceLastAttempt(record: ProblemRecord, attempt: Attempt): ProblemRecord {
  return { ...record, attempts: [...record.attempts.slice(0, -1), attempt] }
}

function withRecord(state: PracticeState, record: ProblemRecord): PracticeState {
  return { ...state, problems: { ...state.problems, [record.key]: record } }
}

function withoutReview(record: ProblemRecord): ProblemRecord {
  const copy = { ...record }
  delete copy.review
  return copy
}

function reviewAfter(stage: Review['stage'], now: number): Review {
  return { stage, dueAt: now + REVIEW_INTERVAL_DAYS[stage - 1] * DAY_MS }
}

function isTrivial(attempt: Attempt): boolean {
  return attempt.activeMs < TRIVIAL_ACTIVE_MS && attempt.hintRequests === 0 && attempt.submits === 0
}

/** Closes attempts untouched for STALE_MS: trivial ones disappear, the rest become unsolved. */
export function normalize(state: PracticeState, now: number): PracticeState {
  let changed = false
  const problems: Record<string, ProblemRecord> = {}

  for (const [key, record] of Object.entries(state.problems)) {
    const open = currentAttempt(record)
    if (!open || now - open.lastActiveAt <= STALE_MS) {
      problems[key] = record
      continue
    }

    changed = true
    if (isTrivial(open)) {
      const attempts = record.attempts.slice(0, -1)
      if (attempts.length > 0 || record.review || record.graduatedAt !== undefined) {
        problems[key] = { ...record, attempts }
      }
      continue
    }

    const endedAt = open.lastActiveAt
    const closed = replaceLastAttempt(record, { ...open, outcome: 'unsolved', endedAt, autoClosed: true })
    problems[key] = open.maxHintLevel >= 1 ? { ...closed, review: reviewAfter(1, endedAt) } : closed
  }

  if (!changed) return state
  const activeKey = state.activeKey && problems[state.activeKey] ? state.activeKey : null
  return { ...state, problems, activeKey }
}

export interface VisitOptions {
  /** The page gave no title yet and the URL slug stood in for it. */
  titleIsFallback?: boolean
}

function refreshMetadata(
  existing: ProblemRecord | undefined,
  ref: ProblemRef,
  statement: string | undefined,
  options: VisitOptions,
): ProblemRecord {
  const key = problemKey(ref.platform, ref.slug)
  const topics = normalizeTopics(ref.topics)
  // A later read that only found the URL slug must not overwrite what an earlier read found.
  const record: ProblemRecord = {
    ...existing,
    key,
    platform: ref.platform,
    slug: ref.slug,
    title: options.titleIsFallback && existing ? existing.title : ref.title,
    url: ref.url,
    topics: topics.length || !existing ? topics : existing.topics,
    attempts: existing?.attempts ?? [],
  }
  if (ref.number) record.number = ref.number
  if (ref.difficulty) record.difficulty = ref.difficulty
  if (statement) record.statement = statement.slice(0, MAX_STATEMENT_CHARS)
  return record
}

export function visit(
  state: PracticeState,
  ref: ProblemRef,
  now: number,
  statement?: string,
  options: VisitOptions = {},
): PracticeState {
  const base = normalize(state, now)
  const record = refreshMetadata(base.problems[problemKey(ref.platform, ref.slug)], ref, statement, options)
  const last = record.attempts.at(-1)

  let attempts = record.attempts
  if (!last || (last.outcome !== undefined && now - (last.endedAt ?? 0) > RESTART_AFTER_FINISH_MS)) {
    attempts = [...attempts, newAttempt(now)]
  } else if (last.outcome === undefined) {
    attempts = [...attempts.slice(0, -1), ping(last, now)]
  }

  return { ...withRecord(base, { ...record, attempts }), activeKey: record.key }
}

export function heartbeat(state: PracticeState, key: string, now: number): PracticeState {
  const base = normalize(state, now)
  const record = base.problems[key]
  if (!record) return base

  const open = currentAttempt(record)
  const next = open ? withRecord(base, replaceLastAttempt(record, ping(open, now))) : base
  return next.activeKey === key ? next : { ...next, activeKey: key }
}

/**
 * The "tab became visible again" update: if the stale rule closed or dropped this problem's
 * attempt while the tab sat in the background, start a fresh one; otherwise just heartbeat.
 * A finish the user logged themselves stays closed.
 */
export function resumeOrHeartbeat(
  state: PracticeState,
  ref: ProblemRef,
  now: number,
  statement?: string,
  options: VisitOptions = {},
): PracticeState {
  const base = normalize(state, now)
  const key = problemKey(ref.platform, ref.slug)
  const last = base.problems[key]?.attempts.at(-1)
  if (!last || last.autoClosed) return visit(base, ref, now, statement, options)
  return heartbeat(base, key, now)
}

export function activePractice(state: PracticeState, now: number): ProblemRecord | null {
  const record = state.activeKey ? state.problems[state.activeKey] : undefined
  const open = record ? currentAttempt(record) : undefined
  return record && open && now - open.lastActiveAt <= ACTIVE_WINDOW_MS ? record : null
}

function updateOpenAttempt(
  state: PracticeState,
  key: string,
  update: (attempt: Attempt) => Attempt,
): PracticeState {
  const record = state.problems[key]
  const open = record ? currentAttempt(record) : undefined
  if (!record || !open) return state
  return withRecord(state, replaceLastAttempt(record, update(open)))
}

export function recordHint(state: PracticeState, key: string, level: HintRequestLevel, now: number): PracticeState {
  return updateOpenAttempt(state, key, (attempt) => ({
    ...ping(attempt, now),
    maxHintLevel: Math.max(attempt.maxHintLevel, level) as HintLevel,
    hintRequests: attempt.hintRequests + 1,
  }))
}

export function recordSubmit(state: PracticeState, key: string, now: number): PracticeState {
  return updateOpenAttempt(state, key, (attempt) => ({ ...ping(attempt, now), submits: attempt.submits + 1 }))
}

export function setApproach(state: PracticeState, key: string, text: string, now: number): PracticeState {
  const approach = text.trim()
  return updateOpenAttempt(state, key, (attempt) => {
    const next: Attempt = { ...ping(attempt, now), approach }
    if (!approach) delete next.approach
    return next
  })
}

export function deriveOutcome(level: HintLevel): 'clean' | 'hinted' | 'assisted' {
  if (level === 0) return 'clean'
  return level <= 2 ? 'hinted' : 'assisted'
}

export function finishAttempt(state: PracticeState, key: string, outcome: Outcome, now: number): PracticeState {
  const record = state.problems[key]
  const last = record?.attempts.at(-1)
  if (!record || !last) return state

  let finished: Attempt
  if (last.outcome === undefined) {
    finished = { ...last, outcome, endedAt: now }
  } else if (last.autoClosed) {
    // The user's own answer replaces the stale rule's "unsolved" guess.
    finished = { ...last, outcome }
    delete finished.autoClosed
  } else {
    // Already logged (e.g. a double click): logging again must not count a second solve.
    return state
  }

  let next: ProblemRecord = { ...record, attempts: [...record.attempts.slice(0, -1), finished] }

  if (outcome !== 'clean') {
    next = { ...next, review: reviewAfter(1, now) }
  } else if (record.review && now >= record.review.dueAt - DUE_EARLY_WINDOW_MS) {
    next =
      record.review.stage === 3
        ? { ...withoutReview(next), graduatedAt: now }
        : { ...next, review: reviewAfter((record.review.stage + 1) as Review['stage'], now) }
  }

  return withRecord(state, next)
}

function endOfLocalDay(now: number): number {
  const date = new Date(now)
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}

function byDueAt(a: ProblemRecord, b: ProblemRecord): number {
  return (a.review?.dueAt ?? 0) - (b.review?.dueAt ?? 0)
}

export function dueProblems(state: PracticeState, now: number): ProblemRecord[] {
  const cutoff = endOfLocalDay(now)
  return Object.values(state.problems)
    .filter((record) => record.review && record.review.dueAt <= cutoff)
    .sort(byDueAt)
}

export function upcomingReviews(state: PracticeState, now: number): ProblemRecord[] {
  const cutoff = endOfLocalDay(now)
  return Object.values(state.problems)
    .filter((record) => record.review && record.review.dueAt > cutoff)
    .sort(byDueAt)
}

export function topicReadiness(state: PracticeState): TopicReadiness[] {
  const totals = new Map<string, { attempted: number; clean: number }>()

  for (const record of Object.values(state.problems)) {
    const latest = latestFinished(record)
    if (!latest) continue
    for (const topic of record.topics) {
      const entry = totals.get(topic) ?? { attempted: 0, clean: 0 }
      entry.attempted += 1
      if (latest.outcome === 'clean') entry.clean += 1
      totals.set(topic, entry)
    }
  }

  return [...totals]
    .map(([topic, entry]) => ({ topic, ...entry }))
    .sort((a, b) => b.attempted - a.attempted || a.topic.localeCompare(b.topic))
}

function localDayKey(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function previousDay(timestamp: number): number {
  const date = new Date(timestamp)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 12).getTime()
}

export function weeklyStats(state: PracticeState, now: number): WeeklyStats {
  const since = now - 7 * DAY_MS
  const cleanDays = new Set<string>()
  const stats: WeeklyStats = { solved: 0, clean: 0, unsolved: 0, streakDays: 0 }

  for (const record of Object.values(state.problems)) {
    for (const attempt of record.attempts) {
      if (attempt.outcome === undefined || attempt.endedAt === undefined) continue
      if (attempt.outcome === 'clean') cleanDays.add(localDayKey(attempt.endedAt))
      if (attempt.endedAt <= since || attempt.endedAt > now) continue

      if (attempt.outcome === 'unsolved') {
        stats.unsolved += 1
      } else {
        stats.solved += 1
        if (attempt.outcome === 'clean') stats.clean += 1
      }
    }
  }

  let cursor = cleanDays.has(localDayKey(now)) ? now : previousDay(now)
  while (cleanDays.has(localDayKey(cursor))) {
    stats.streakDays += 1
    cursor = previousDay(cursor)
  }

  return stats
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isTime(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function coerceAttempt(value: unknown): Attempt | null {
  if (!isObject(value)) return null
  const { startedAt, lastActiveAt, activeMs, maxHintLevel, hintRequests, submits } = value
  if (![startedAt, lastActiveAt, activeMs, hintRequests, submits].every(isTime)) return null
  if (typeof maxHintLevel !== 'number' || ![0, 1, 2, 3, 4].includes(maxHintLevel)) return null

  const attempt: Attempt = {
    startedAt: startedAt as number,
    lastActiveAt: lastActiveAt as number,
    activeMs: activeMs as number,
    maxHintLevel: maxHintLevel as HintLevel,
    hintRequests: hintRequests as number,
    submits: submits as number,
  }
  if (typeof value.approach === 'string') attempt.approach = value.approach
  if (OUTCOMES.includes(value.outcome as Outcome)) attempt.outcome = value.outcome as Outcome
  if (isTime(value.endedAt)) attempt.endedAt = value.endedAt
  if (value.autoClosed === true) attempt.autoClosed = true
  return attempt
}

function coerceRecord(key: string, value: unknown): ProblemRecord | null {
  if (!isObject(value) || !Array.isArray(value.attempts)) return null
  const { platform, slug, title, url } = value
  if (!PLATFORMS.includes(platform as Platform)) return null
  if (typeof slug !== 'string' || typeof title !== 'string' || typeof url !== 'string') return null
  if (key !== problemKey(platform as Platform, slug)) return null

  const record: ProblemRecord = {
    platform: platform as Platform,
    slug,
    key,
    title,
    url,
    topics: Array.isArray(value.topics) ? value.topics.filter((topic) => typeof topic === 'string') : [],
    attempts: value.attempts.map(coerceAttempt).filter((attempt): attempt is Attempt => attempt !== null),
  }
  if (typeof value.number === 'string') record.number = value.number
  if (typeof value.difficulty === 'string') record.difficulty = value.difficulty
  if (typeof value.statement === 'string') record.statement = value.statement.slice(0, MAX_STATEMENT_CHARS)
  if (isObject(value.review) && [1, 2, 3].includes(value.review.stage as number) && isTime(value.review.dueAt)) {
    record.review = { stage: value.review.stage as Review['stage'], dueAt: value.review.dueAt }
  }
  if (isTime(value.graduatedAt)) record.graduatedAt = value.graduatedAt
  return record
}

/** Turns whatever is in storage into a valid state, dropping records it cannot repair. */
export function coerceState(value: unknown): PracticeState {
  if (!isObject(value) || value.version !== 1 || !isObject(value.problems)) return createEmptyState()

  const problems: Record<string, ProblemRecord> = {}
  for (const [key, raw] of Object.entries(value.problems)) {
    const record = coerceRecord(key, raw)
    if (record) problems[key] = record
  }

  const activeKey = typeof value.activeKey === 'string' && problems[value.activeKey] ? value.activeKey : null
  return { version: 1, problems, activeKey }
}

function lastActivity(record: ProblemRecord): number {
  return record.attempts.reduce(
    (latest, attempt) => Math.max(latest, attempt.lastActiveAt, attempt.endedAt ?? 0),
    0,
  )
}

export function trimState(state: PracticeState): PracticeState {
  let changed = false
  let records = Object.values(state.problems).map((record) => {
    if (record.attempts.length <= MAX_ATTEMPTS_PER_PROBLEM) return record
    changed = true
    return { ...record, attempts: record.attempts.slice(-MAX_ATTEMPTS_PER_PROBLEM) }
  })

  if (records.length > MAX_PROBLEMS) {
    changed = true
    records = records.sort((a, b) => lastActivity(b) - lastActivity(a)).slice(0, MAX_PROBLEMS)
  }

  if (!changed) return state
  const problems = Object.fromEntries(records.map((record) => [record.key, record]))
  const activeKey = state.activeKey && problems[state.activeKey] ? state.activeKey : null
  return { ...state, problems, activeKey }
}
