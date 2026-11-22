import { normalizeTopics } from './topics.ts'
import type { Platform } from './types.ts'

export const PLATFORM_LABELS: Record<Platform, string> = {
  leetcode: 'LeetCode',
  gfg: 'GeeksforGeeks',
  tuf: 'takeUforward',
}

const PRACTICE_HOSTS: Record<string, Platform> = {
  'leetcode.com': 'leetcode',
  'www.geeksforgeeks.org': 'gfg',
  'geeksforgeeks.org': 'gfg',
  'takeuforward.org': 'tuf',
}

export interface ParsedProblemUrl {
  platform: Platform
  slug: string
  url: string
}

export interface ParsedMeta {
  title?: string
  number?: string
  difficulty?: string
  topics: string[]
  contentHtml?: string
}

export function isPracticeHost(hostname: string): boolean {
  return hostname in PRACTICE_HOSTS
}

export function parseProblemUrl(href: string): ParsedProblemUrl | null {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }

  const platform = PRACTICE_HOSTS[url.hostname]
  const segments = url.pathname.split('/').filter(Boolean)

  if (platform === 'leetcode' && segments[0] === 'problems' && segments[1]) {
    return { platform, slug: segments[1], url: `https://leetcode.com/problems/${segments[1]}/` }
  }

  if (platform === 'gfg' && segments[0] === 'problems' && segments[1]) {
    const variant = segments[2] ? `/${segments[2]}` : ''
    return {
      platform,
      slug: segments[1],
      url: `https://www.geeksforgeeks.org/problems/${segments[1]}${variant}`,
    }
  }

  if (platform === 'tuf' && segments[0] === 'practice' && segments[1] === 'dsa' && segments[2]) {
    return { platform, slug: segments[2], url: `https://takeuforward.org/practice/dsa/${segments[2]}` }
  }

  return null
}

export function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

export function stripNumberPrefix(text: string): { number?: string; title: string } {
  const trimmed = text.trim()
  const match = trimmed.match(/^(\d+)\.\s+(.+)$/)
  return match ? { number: match[1], title: match[2].trim() } : { title: trimmed }
}

export function parseDifficultyText(text: string): string | undefined {
  const match = text.match(/\b(basic|school|easy|medium|hard)\b/i)
  if (!match) return undefined
  const word = match[1].toLowerCase()
  return word[0].toUpperCase() + word.slice(1)
}

/** Badges read one element at a time; a container's textContent glues them ("BasicHints"). */
export function pickDifficulty(texts: readonly string[]): string | undefined {
  for (const text of texts) {
    const difficulty = parseDifficultyText(text)
    if (difficulty) return difficulty
  }
  return undefined
}

function parseJson(raw: string | null | undefined): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (typeof item === 'string') return [item]
    if (isRecord(item) && typeof item.name === 'string') return [item.name]
    return []
  })
}

function withoutUndefined(meta: ParsedMeta): ParsedMeta {
  return Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== undefined),
  ) as unknown as ParsedMeta
}

export function parseLeetCodeNextData(raw: string | null | undefined, slug: string): ParsedMeta | null {
  const data = parseJson(raw)
  if (!isRecord(data)) return null

  const props = isRecord(data.props) ? data.props : undefined
  const pageProps = props && isRecord(props.pageProps) ? props.pageProps : undefined
  const dehydrated = pageProps && isRecord(pageProps.dehydratedState) ? pageProps.dehydratedState : undefined
  const queries = dehydrated && Array.isArray(dehydrated.queries) ? dehydrated.queries : []

  for (const query of queries) {
    const state = isRecord(query) && isRecord(query.state) ? query.state : undefined
    const queryData = state && isRecord(state.data) ? state.data : undefined
    const question = queryData && isRecord(queryData.question) ? queryData.question : undefined
    // Client-side navigation leaves __NEXT_DATA__ describing the first problem loaded.
    if (!question || question.titleSlug !== slug) continue

    return withoutUndefined({
      title: readString(question.title),
      number: readString(question.questionFrontendId),
      difficulty: readString(question.difficulty),
      topics: normalizeTopics(readNames(question.topicTags)),
      contentHtml: readString(question.content),
    })
  }

  return null
}

export function parseGfgNextData(raw: string | null | undefined, slug: string): ParsedMeta | null {
  const data = parseJson(raw)
  if (!isRecord(data)) return null

  let node: unknown = data
  for (const key of ['props', 'pageProps', 'initialState', 'problemData', 'allData', 'probData']) {
    node = isRecord(node) ? node[key] : undefined
  }
  if (!isRecord(node) || node.slug !== slug) return null

  const tags = isRecord(node.tags) ? node.tags : undefined
  return withoutUndefined({
    title: readString(node.problem_name),
    difficulty: readString(node.difficulty),
    topics: normalizeTopics(readNames(tags?.topic_tags)),
    contentHtml: readString(node.problem_question),
  })
}
