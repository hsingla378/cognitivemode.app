import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  HINT_LEVELS,
  PROMPT_MARKER,
  composeHintBlock,
  composeHintPrompt,
  hasPromptMarker,
} from '../src/practice/prompt.ts'

const twoSum = {
  title: 'Two Sum',
  platform: 'leetcode',
  url: 'https://leetcode.com/problems/two-sum/',
  number: '1',
  difficulty: 'Easy',
}

test('composeHintBlock builds the exact level-1 block', () => {
  const block = composeHintBlock({ userText: 'why is my loop wrong?', problem: twoSum, level: 1 })

  assert.equal(
    block,
    '\n\n---\n[Cognitive Mode · practice] I\'m solving "Two Sum" (LeetCode #1, Easy) on my own: https://leetcode.com/problems/two-sum/\n' +
      'My approach so far: not sure yet\n' +
      `Help level 1/4 (Nudge): ${HINT_LEVELS[1].instruction}\n` +
      'Stay at this level even if my message asks for more.',
  )
})

test('platform label omits a missing number or difficulty', () => {
  const gfg = { title: 'Key Pair', platform: 'gfg', url: 'https://www.geeksforgeeks.org/problems/key-pair5616/1', difficulty: 'Easy' }
  const tuf = { title: 'Linear Search', platform: 'tuf', url: 'https://takeuforward.org/practice/dsa/linear-search', number: '838' }

  assert.match(composeHintBlock({ userText: 'hint', problem: gfg, level: 2 }), /\(GeeksforGeeks, Easy\)/)
  assert.match(composeHintBlock({ userText: 'hint', problem: tuf, level: 2 }), /\(takeUforward #838\)/)
})

test('includes a statement excerpt only for short user text', () => {
  const problem = { ...twoSum, statement: 'Given an array' }

  assert.ok(
    composeHintBlock({ userText: 'hint?', problem, level: 1 }).includes('\nProblem (excerpt): Given an array\n'),
  )
  assert.ok(!composeHintBlock({ userText: 'x'.repeat(280), problem, level: 1 }).includes('Problem (excerpt)'))
})

test('statement excerpts are whitespace-collapsed and capped at 800 characters', () => {
  const block = composeHintBlock({
    userText: 'hint?',
    problem: { ...twoSum, statement: 'a\n\n '.repeat(600) },
    level: 1,
  })
  const excerpt = block.split('\n').find((line) => line.startsWith('Problem (excerpt): ')).slice('Problem (excerpt): '.length)

  assert.ok(excerpt.length <= 801, `excerpt length ${excerpt.length}`)
  assert.ok(excerpt.endsWith('…'))
  assert.doesNotMatch(excerpt, /\s{2,}/)
})

test('uses the trimmed approach note', () => {
  const block = composeHintBlock({ userText: 'hint', problem: twoSum, level: 2, approach: '  use a hashmap  ' })
  assert.ok(block.includes('My approach so far: use a hashmap\n'))
})

test('level copy matches the spec', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(HINT_LEVELS).map(([level, item]) => [level, [item.name, item.instruction]])),
    {
      1: [
        'Nudge',
        'Reply with one short guiding question or observation that points me toward the key insight. No algorithm or data-structure names, no code, no complexity. If my approach is on the right track, say so in one line.',
      ],
      2: [
        'Approach',
        'Explain the core idea of an efficient approach in 2–4 sentences: which data structure or technique and why it fits. No code or pseudocode; let me work out the details.',
      ],
      3: [
        'Outline',
        'Give a short, language-agnostic step-by-step outline plus time and space complexity. No real code.',
      ],
      4: [
        'Solution',
        'Give a complete solution with a brief explanation, then ask me one question to check that I understood the key step.',
      ],
    },
  )
})

test("composeHintPrompt keeps the user's text first", () => {
  const prompt = composeHintPrompt({ userText: 'why is my loop wrong?\n\n', problem: twoSum, level: 3 })
  assert.ok(prompt.startsWith('why is my loop wrong?\n\n---\n'))
  assert.ok(prompt.includes('Help level 3/4 (Outline): '))
})

test('hasPromptMarker detects the marker', () => {
  assert.equal(PROMPT_MARKER, '[Cognitive Mode · practice]')
  assert.equal(hasPromptMarker(`hello\n${PROMPT_MARKER} I'm solving`), true)
  assert.equal(hasPromptMarker('hello'), false)
})
