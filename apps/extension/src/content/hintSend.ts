import { composeHintBlock } from '../practice/prompt.ts'
import type { HintPromptInput } from '../practice/prompt.ts'
import type { HintRequestLevel } from '../practice/types.ts'

export interface HintSendDeps {
  /** Appends text to the composer; resolves true only if it is visibly there. */
  append(text: string): Promise<boolean>
  copy(text: string): Promise<boolean>
  record(level: HintRequestLevel, approach: string): Promise<void>
  send(): void
  /** Lets the next Enter/Send be intercepted again without sending anything now. */
  release(): void
}

export type HintSendResult = 'sent' | 'copied' | 'failed'

/**
 * The user's prompt only goes out with the hint-level block attached. If the editor
 * refuses the insertion, nothing is sent: the block is copied so the user can paste it
 * after their message (which is still in the composer).
 */
export async function sendWithHint(deps: HintSendDeps, input: HintPromptInput): Promise<HintSendResult> {
  const block = composeHintBlock(input)
  if (await deps.append(block)) {
    try {
      await deps.record(input.level, input.approach ?? '')
    } catch {
      // Losing one hint count is better than holding back a prompt the user already chose to send.
    }
    deps.send()
    return 'sent'
  }

  const copied = await deps.copy(block)
  deps.release()
  return copied ? 'copied' : 'failed'
}

export function sendAsIs(deps: Pick<HintSendDeps, 'send'>): void {
  deps.send()
}
