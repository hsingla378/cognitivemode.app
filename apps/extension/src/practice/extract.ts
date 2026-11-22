import { MAX_STATEMENT_CHARS } from './model.ts'
import {
  parseDifficultyText,
  parseGfgNextData,
  parseLeetCodeNextData,
  parseProblemUrl,
  pickDifficulty,
  stripNumberPrefix,
  titleFromSlug,
} from './platforms.ts'
import type { ParsedMeta } from './platforms.ts'
import { normalizeTopics } from './topics.ts'
import type { Platform, ProblemRef } from './types.ts'

export interface ExtractedProblem {
  ref: ProblemRef
  statement?: string
  /** True when the page didn't yield a title yet and the slug stood in for it. */
  fromFallback: boolean
}

interface PageMeta extends Omit<ParsedMeta, 'contentHtml'> {
  statement?: string
}

function textOf(element: Element | null | undefined): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function htmlToText(html: string): string {
  // DOMParser documents never run scripts, so problem HTML is safe to parse here.
  return new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
}

function nextData(doc: Document): string | undefined {
  return doc.getElementById('__NEXT_DATA__')?.textContent ?? undefined
}

function readLeetCode(doc: Document, slug: string): PageMeta {
  const next = parseLeetCodeNextData(nextData(doc), slug)
  if (next) {
    return {
      ...next,
      statement: next.contentHtml ? htmlToText(next.contentHtml) : undefined,
    }
  }

  // __NEXT_DATA__ goes stale after in-app navigation. The title link for this exact slug is
  // what proves the DOM already shows this problem; until it does, read nothing from the page.
  const titleLink = [...doc.querySelectorAll(`a[href="/problems/${slug}/"]`)].find((link) => textOf(link))
  if (!titleLink) return { topics: [] }

  const domTitle = stripNumberPrefix(textOf(titleLink))
  return {
    title: domTitle.title || undefined,
    number: domTitle.number,
    difficulty: parseDifficultyText(textOf(doc.querySelector('[class*="text-difficulty"]'))),
    topics: normalizeTopics([...doc.querySelectorAll('a[href^="/tag/"]')].map(textOf)),
    statement: textOf(doc.querySelector('[data-track-load="description_content"]')),
  }
}

// GFG prints "Difficulty: Easy" a few levels above the title; walk up until it shows.
function gfgDifficulty(titleElement: Element | null): string | undefined {
  let node = titleElement?.parentElement
  for (let depth = 0; node && depth < 5; depth += 1, node = node.parentElement) {
    const match = textOf(node).match(/Difficulty:\s*(Basic|School|Easy|Medium|Hard)/i)
    if (match) return parseDifficultyText(match[1])
  }
  return undefined
}

function readGfg(doc: Document, slug: string): PageMeta {
  const next = parseGfgNextData(nextData(doc), slug)
  if (next) {
    return {
      ...next,
      statement: next.contentHtml ? htmlToText(next.contentHtml) : undefined,
    }
  }

  // Only the problem-title heading counts; a bare h3 can be any section heading on the page.
  const titleElement = doc.querySelector('h3.g-m-0')
  if (!titleElement) return { topics: [] }

  return {
    title: textOf(titleElement) || undefined,
    difficulty: gfgDifficulty(titleElement),
    topics: normalizeTopics([...doc.querySelectorAll('a[href*="/explore?category"]')].map(textOf)),
    statement: textOf(doc.querySelector('[class*="problem_content"]')),
  }
}

function readTuf(doc: Document): PageMeta {
  // The problem panel's title heading specifically, not whatever h1 the page has.
  const heading = doc.querySelector('h1[class*="ProblemPanel"][class*="title"]')
  if (!heading) return { topics: [] }
  const { number, title } = stripNumberPrefix(textOf(heading))
  const badges = [...(heading.parentElement?.querySelectorAll('span, div, p') ?? [])].map(textOf)

  return {
    title: title || undefined,
    number,
    difficulty: pickDifficulty(badges),
    topics: [],
    // The h1's own class contains "ProblemPanel", so target the panel's content block explicitly.
    statement: textOf(doc.querySelector('[class*="ProblemPanel"][class*="__content"]')),
  }
}

const READERS: Record<Platform, (doc: Document, slug: string) => PageMeta> = {
  leetcode: readLeetCode,
  gfg: readGfg,
  tuf: (doc) => readTuf(doc),
}

export function extractProblem(href: string, doc: Document): ExtractedProblem | null {
  const parsed = parseProblemUrl(href)
  if (!parsed) return null

  const meta = READERS[parsed.platform](doc, parsed.slug)
  const ref: ProblemRef = {
    platform: parsed.platform,
    slug: parsed.slug,
    url: parsed.url,
    title: meta.title ?? titleFromSlug(parsed.slug),
    topics: meta.topics,
  }
  if (meta.number) ref.number = meta.number
  if (meta.difficulty) ref.difficulty = meta.difficulty

  const statement = meta.statement?.replace(/\s+/g, ' ').trim().slice(0, MAX_STATEMENT_CHARS)
  return { ref, statement: statement || undefined, fromFallback: !meta.title }
}

export function isSubmitClick(platform: Platform, target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (platform === 'leetcode') return !!target.closest('[data-e2e-locator="console-submit-button"]')

  const button = target.closest('button')
  if (!button) return false
  if (platform === 'gfg' && /submit_button/i.test(button.className)) return true
  return button.textContent?.trim() === 'Submit'
}
