export type Platform = 'leetcode' | 'gfg' | 'tuf'

export type Outcome = 'clean' | 'hinted' | 'assisted' | 'unsolved'

export type HintLevel = 0 | 1 | 2 | 3 | 4

export type HintRequestLevel = Exclude<HintLevel, 0>

export interface ProblemRef {
  platform: Platform
  /** Stable id taken from the problem URL. */
  slug: string
  title: string
  /** Canonical problem URL. */
  url: string
  number?: string
  difficulty?: string
  /** Normalized topic names; may be empty. */
  topics: string[]
}

export interface Attempt {
  startedAt: number
  lastActiveAt: number
  /** Time actually spent: the sum of gaps of at most 2 minutes between activity pings. */
  activeMs: number
  maxHintLevel: HintLevel
  hintRequests: number
  /** Submit-button clicks seen on the problem page. */
  submits: number
  /** The user's approach note, sent along with hint requests. */
  approach?: string
  outcome?: Outcome
  endedAt?: number
  /** Closed by the stale rule rather than by the user. */
  autoClosed?: boolean
}

export interface Review {
  stage: 1 | 2 | 3
  dueAt: number
}

export interface ProblemRecord extends ProblemRef {
  /** `${platform}:${slug}` */
  key: string
  /** Plain-text statement excerpt, kept locally only. */
  statement?: string
  /** The last element is the current or latest attempt. */
  attempts: Attempt[]
  review?: Review
  graduatedAt?: number
}

export interface PracticeState {
  version: 1
  problems: Record<string, ProblemRecord>
  activeKey: string | null
}

export interface TopicReadiness {
  topic: string
  attempted: number
  clean: number
}

export interface WeeklyStats {
  solved: number
  clean: number
  unsolved: number
  streakDays: number
}
