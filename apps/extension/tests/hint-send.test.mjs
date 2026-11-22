import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { sendAsIs, sendWithHint } from '../src/content/hintSend.ts'
import { composeHintBlock } from '../src/practice/prompt.ts'

const input = {
  userText: 'why does this time out?',
  problem: { title: 'Two Sum', platform: 'leetcode', url: 'https://leetcode.com/problems/two-sum/', number: '1' },
  level: 2,
  approach: 'nested loops',
}

function fakeDeps({ appendOk = true, copyOk = true, recordFails = false } = {}) {
  const calls = []
  const received = {}
  const deps = {
    async append(text) {
      calls.push('append')
      received.append = text
      return appendOk
    },
    async copy(text) {
      calls.push('copy')
      received.copy = text
      return copyOk
    },
    async record(level, approach) {
      calls.push('record')
      received.record = [level, approach]
      if (recordFails) throw new Error('storage unavailable')
    },
    send() {
      calls.push('send')
    },
    release() {
      calls.push('release')
    },
  }
  return { deps, calls, received }
}

test('sendWithHint appends the block, records the hint, then sends', async () => {
  const { deps, calls, received } = fakeDeps()

  assert.equal(await sendWithHint(deps, input), 'sent')
  assert.deepEqual(calls, ['append', 'record', 'send'])
  assert.equal(received.append, composeHintBlock(input))
  assert.deepEqual(received.record, [2, 'nested loops'])
})

test('sendWithHint never sends when insertion fails', async () => {
  const copied = fakeDeps({ appendOk: false })
  assert.equal(await sendWithHint(copied.deps, input), 'copied')
  assert.deepEqual(copied.calls, ['append', 'copy', 'release'])
  // Only the block: the user's own text is still in the composer, so copying it again would duplicate it.
  assert.equal(copied.received.copy, composeHintBlock(input))

  const failed = fakeDeps({ appendOk: false, copyOk: false })
  assert.equal(await sendWithHint(failed.deps, input), 'failed')
  assert.ok(!failed.calls.includes('send'))
})

test('a failing hint record still sends the prompt', async () => {
  const { deps, calls } = fakeDeps({ recordFails: true })

  assert.equal(await sendWithHint(deps, input), 'sent')
  assert.deepEqual(calls, ['append', 'record', 'send'])
})

test('sendAsIs sends without recording', () => {
  const { deps, calls } = fakeDeps()
  sendAsIs(deps)
  assert.deepEqual(calls, ['send'])
})

test('hint ladder has no timers or minimum lengths', () => {
  const source = readFileSync(new URL('../src/content/HintLadder.tsx', import.meta.url), 'utf8')

  assert.doesNotMatch(source, /setInterval|setTimeout\(|MIN_CHARS|countdown/i)
  assert.match(source, /'Escape'/)
})

test('hint ladder is fully keyboard operable', () => {
  const source = readFileSync(new URL('../src/content/HintLadder.tsx', import.meta.url), 'utf8')

  // "0" sends as is, Enter on a focused button activates that button, and focus starts in the dialog.
  assert.match(source, /event\.key === '0'/)
  assert.match(source, /instanceof HTMLButtonElement/)
  assert.match(source, /autoFocus/)
})
