import { PLATFORM_LABELS } from './platforms.ts'
import type { HintRequestLevel, ProblemRecord } from './types.ts'

export const PROMPT_MARKER = '[Cognitive Mode · practice]'

/** The statement is only attached when the user didn't paste the problem themselves. */
export const STATEMENT_INCLUDE_BELOW_CHARS = 280
export const STATEMENT_EXCERPT_CHARS = 800

export const HINT_LEVELS: Record<HintRequestLevel, { name: string; blurb: string; instruction: string }> = {
  1: {
    name: 'Nudge',
    blurb: 'one guiding question',
    instruction:
      'Reply with one short guiding question or observation that points me toward the key insight. No algorithm or data-structure names, no code, no complexity. If my approach is on the right track, say so in one line.',
  },
  2: {
    name: 'Approach',
    blurb: 'key idea, no code',
    instruction:
      'Explain the core idea of an efficient approach in 2–4 sentences: which data structure or technique and why it fits. No code or pseudocode; let me work out the details.',
  },
  3: {
    name: 'Outline',
    blurb: 'steps, no real code',
    instruction:
      'Give a short, language-agnostic step-by-step outline plus time and space complexity. No real code.',
  },
  4: {
    name: 'Solution',
    blurb: 'full answer (assisted)',
    instruction:
      'Give a complete solution with a brief explanation, then ask me one question to check that I understood the key step.',
  },
}

export interface HintPromptInput {
  userText: string
  problem: Pick<ProblemRecord, 'title' | 'platform' | 'url' | 'number' | 'difficulty' | 'statement'>
  level: HintRequestLevel
  approach?: string
}

function problemLabel(problem: HintPromptInput['problem']): string {
  const number = problem.number ? ` #${problem.number}` : ''
  const difficulty = problem.difficulty ? `, ${problem.difficulty}` : ''
  return `${PLATFORM_LABELS[problem.platform]}${number}${difficulty}`
}

function statementExcerpt(statement: string): string {
  const collapsed = statement.replace(/\s+/g, ' ').trim()
  if (collapsed.length <= STATEMENT_EXCERPT_CHARS) return collapsed
  return `${collapsed.slice(0, STATEMENT_EXCERPT_CHARS).trimEnd()}…`
}

/** The text appended after the user's own message; starts with a blank line and a rule. */
export function composeHintBlock({ userText, problem, level, approach }: HintPromptInput): string {
  const { name, instruction } = HINT_LEVELS[level]
  const includeStatement = !!problem.statement?.trim() && userText.trim().length < STATEMENT_INCLUDE_BELOW_CHARS

  const lines = [
    `${PROMPT_MARKER} I'm solving "${problem.title}" (${problemLabel(problem)}) on my own: ${problem.url}`,
    ...(includeStatement && problem.statement ? [`Problem (excerpt): ${statementExcerpt(problem.statement)}`] : []),
    `My approach so far: ${approach?.trim() || 'not sure yet'}`,
    `Help level ${level}/4 (${name}): ${instruction}`,
    'Stay at this level even if my message asks for more.',
  ]

  return `\n\n---\n${lines.join('\n')}`
}

export function composeHintPrompt(input: HintPromptInput): string {
  return `${input.userText.trimEnd()}${composeHintBlock(input)}`
}

export function hasPromptMarker(text: string): boolean {
  return text.includes(PROMPT_MARKER)
}
