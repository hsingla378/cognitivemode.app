import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isPracticeHost,
  parseDifficultyText,
  parseGfgNextData,
  parseLeetCodeNextData,
  parseProblemUrl,
  pickDifficulty,
  stripNumberPrefix,
  titleFromSlug,
} from '../src/practice/platforms.ts'
import { normalizeTopics } from '../src/practice/topics.ts'

test('parseProblemUrl recognizes LeetCode problem pages', () => {
  const expected = {
    platform: 'leetcode',
    slug: 'two-sum',
    url: 'https://leetcode.com/problems/two-sum/',
  }

  assert.deepEqual(parseProblemUrl('https://leetcode.com/problems/two-sum/description/'), expected)
  assert.deepEqual(
    parseProblemUrl('https://leetcode.com/problems/two-sum/submissions/123/?envType=x'),
    expected,
  )
  assert.equal(parseProblemUrl('https://leetcode.com/problemset/'), null)
})

test('parseProblemUrl recognizes GeeksforGeeks problem pages', () => {
  assert.deepEqual(parseProblemUrl('https://www.geeksforgeeks.org/problems/key-pair5616/1?utm=x#y'), {
    platform: 'gfg',
    slug: 'key-pair5616',
    url: 'https://www.geeksforgeeks.org/problems/key-pair5616/1',
  })
})

test('parseProblemUrl recognizes takeuforward practice pages', () => {
  assert.deepEqual(parseProblemUrl('https://takeuforward.org/practice/dsa/linear-search'), {
    platform: 'tuf',
    slug: 'linear-search',
    url: 'https://takeuforward.org/practice/dsa/linear-search',
  })
  assert.equal(parseProblemUrl('https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet'), null)
  assert.equal(parseProblemUrl('https://chatgpt.com/'), null)
  assert.equal(parseProblemUrl('not a url'), null)
})

test('isPracticeHost matches only supported practice sites', () => {
  assert.equal(isPracticeHost('leetcode.com'), true)
  assert.equal(isPracticeHost('www.geeksforgeeks.org'), true)
  assert.equal(isPracticeHost('takeuforward.org'), true)
  assert.equal(isPracticeHost('chatgpt.com'), false)
})

test('titleFromSlug turns a URL slug into a readable fallback title', () => {
  assert.equal(titleFromSlug('two-sum'), 'Two Sum')
  assert.equal(titleFromSlug('key-pair5616'), 'Key Pair5616')
})

test('stripNumberPrefix separates the problem number from the title', () => {
  assert.deepEqual(stripNumberPrefix('838. Linear Search'), { number: '838', title: 'Linear Search' })
  assert.deepEqual(stripNumberPrefix('Two Sum'), { title: 'Two Sum' })
})

test('parseDifficultyText recognizes platform difficulty labels', () => {
  assert.equal(parseDifficultyText('Difficulty: Easy'), 'Easy')
  assert.equal(parseDifficultyText('medium'), 'Medium')
  assert.equal(parseDifficultyText('Basic'), 'Basic')
  assert.equal(parseDifficultyText('Premium'), undefined)
})

test('pickDifficulty reads separate badge texts that textContent would glue together', () => {
  assert.equal(parseDifficultyText('BasicHintsCompanies'), undefined)
  assert.equal(pickDifficulty(['BasicHintsCompanies', 'Basic', 'Hints', 'Companies']), 'Basic')
  assert.equal(pickDifficulty(['Hints', 'Companies']), undefined)
})

test('parseLeetCodeNextData reads the question only when the slug matches', () => {
  const raw = JSON.stringify({
    props: {
      pageProps: {
        dehydratedState: {
          queries: [
            {
              state: {
                data: {
                  question: {
                    titleSlug: 'two-sum',
                    title: 'Two Sum',
                    questionFrontendId: '1',
                    difficulty: 'Easy',
                    topicTags: [{ name: 'Array' }, { name: 'Hash Table' }],
                    content: '<p>Given</p>',
                  },
                },
              },
            },
          ],
        },
      },
    },
  })

  assert.deepEqual(parseLeetCodeNextData(raw, 'two-sum'), {
    title: 'Two Sum',
    number: '1',
    difficulty: 'Easy',
    topics: ['Arrays', 'Hashing'],
    contentHtml: '<p>Given</p>',
  })
  assert.equal(parseLeetCodeNextData(raw, '3sum'), null)
  assert.equal(parseLeetCodeNextData('not json', 'two-sum'), null)
  assert.equal(parseLeetCodeNextData(undefined, 'two-sum'), null)
})

test('parseGfgNextData reads probData', () => {
  const raw = JSON.stringify({
    props: {
      pageProps: {
        initialState: {
          problemData: {
            allData: {
              probData: {
                slug: 'key-pair5616',
                problem_name: 'Two Sum - Pair with Given Sum',
                difficulty: 'Easy',
                tags: { topic_tags: ['Arrays', 'Hash'] },
              },
            },
          },
        },
      },
    },
  })

  assert.deepEqual(parseGfgNextData(raw, 'key-pair5616'), {
    title: 'Two Sum - Pair with Given Sum',
    difficulty: 'Easy',
    topics: ['Arrays', 'Hashing'],
  })
  assert.equal(parseGfgNextData(raw, 'other-problem'), null)
})

test('normalizeTopics folds plurals and synonyms', () => {
  assert.deepEqual(normalizeTopics(['Array', 'Hash Table']), ['Arrays', 'Hashing'])
  assert.deepEqual(normalizeTopics(['dp', 'Dynamic Programming']), ['Dynamic Programming'])
  assert.deepEqual(normalizeTopics(['  Some New Topic ']), ['Some New Topic'])
  assert.deepEqual(normalizeTopics(['']), [])
})
