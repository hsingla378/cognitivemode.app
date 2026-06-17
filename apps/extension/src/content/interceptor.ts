import type { PendingSubmit } from './types'

const PROMPT_INPUT_SELECTORS = [
  '#prompt-textarea',
  'textarea[placeholder*="Message"]',
  'textarea[placeholder*="message"]',
  'div[contenteditable="true"][data-placeholder]',
  'div.ProseMirror',
  'div[contenteditable="true"].ProseMirror',
  '[data-testid="composer-textarea"]',
  'rich-textarea textarea',
]

const SEND_BUTTON_SELECTORS = [
  'button[data-testid="send-button"]',
  'button[data-testid="composer-send-button"]',
  'button[aria-label="Send message"]',
  'button[aria-label="Send Message"]',
  'button[aria-label*="Send"]',
  'button[aria-label*="send"]',
]

export interface InterceptorHandle {
  /** Temporarily bypass interception so a pending message can be sent. */
  unlock: (submit?: () => void) => void
  /** Tear down listeners and observers. */
  destroy: () => void
}

function findPromptInput(): HTMLElement | null {
  return document.querySelector<HTMLElement>(PROMPT_INPUT_SELECTORS.join(', '))
}

function findSendButton(input: HTMLElement | null): HTMLButtonElement | null {
  const roots = [
    input?.closest('form'),
    input?.closest('[class*="composer"]'),
    input?.parentElement?.parentElement,
    input?.parentElement,
  ]

  for (const root of roots) {
    if (!root) continue
    const button = root.querySelector<HTMLButtonElement>(SEND_BUTTON_SELECTORS.join(', '))
    if (button) return button
  }

  return document.querySelector<HTMLButtonElement>(SEND_BUTTON_SELECTORS.join(', '))
}

function hasPromptContent(input: HTMLElement): boolean {
  if (input instanceof HTMLTextAreaElement) {
    return input.value.trim().length > 0
  }
  return (input.textContent?.trim().length ?? 0) > 0
}

function createPendingSubmit(input: HTMLElement): PendingSubmit {
  const sendButton = findSendButton(input)

  return {
    input,
    trigger: () => {
      if (sendButton && !sendButton.disabled) {
        sendButton.click()
        return
      }

      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          bubbles: true,
          cancelable: true,
        }),
      )
    },
  }
}

export function initInterceptor(onIntercept: (pending: PendingSubmit) => void): InterceptorHandle {
  let isUnlocked = false
  let activeInput: HTMLElement | null = null
  let boundInput: HTMLElement | null = null
  let boundButton: HTMLButtonElement | null = null
  let detachElementListeners: (() => void) | null = null

  const unlock = (submit?: () => void) => {
    isUnlocked = true
    submit?.()
    window.setTimeout(() => {
      isUnlocked = false
      activeInput = null
    }, 0)
  }

  const intercept = (pending: PendingSubmit) => {
    activeInput = pending.input
    onIntercept(pending)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isUnlocked) return
    if (event.key !== 'Enter' || event.shiftKey) return

    const input = event.currentTarget as HTMLElement
    if (!hasPromptContent(input)) return

    event.preventDefault()
    event.stopPropagation()
    intercept(createPendingSubmit(input))
  }

  const handleSendClick = (event: MouseEvent) => {
    if (isUnlocked) return

    const button = event.currentTarget as HTMLButtonElement
    if (button.disabled) return

    const input =
      activeInput ??
      boundInput ??
      findPromptInput()

    if (!input || !hasPromptContent(input)) return

    event.preventDefault()
    event.stopPropagation()
    intercept(createPendingSubmit(input))
  }

  const bindElements = () => {
    if (boundInput?.isConnected && boundButton?.isConnected) return

    detachElementListeners?.()
    detachElementListeners = null
    boundInput = null
    boundButton = null

    const input = findPromptInput()
    if (!input) return

    const button = findSendButton(input)

    input.addEventListener('keydown', handleKeyDown, true)
    boundInput = input

    if (button) {
      button.addEventListener('click', handleSendClick, true)
      boundButton = button
    }

    detachElementListeners = () => {
      input.removeEventListener('keydown', handleKeyDown, true)
      button?.removeEventListener('click', handleSendClick, true)
    }
  }

  bindElements()

  const observer = new MutationObserver(() => {
    bindElements()
  })
  observer.observe(document.body, { childList: true, subtree: true })

  const handleFocusIn = (event: FocusEvent) => {
    const target = event.target
    if (target instanceof HTMLElement && target.matches(PROMPT_INPUT_SELECTORS.join(', '))) {
      activeInput = target
    }
  }
  document.addEventListener('focusin', handleFocusIn, true)

  const destroy = () => {
    observer.disconnect()
    document.removeEventListener('focusin', handleFocusIn, true)
    detachElementListeners?.()
    detachElementListeners = null
    boundInput = null
    boundButton = null
    activeInput = null
  }

  return { unlock, destroy }
}
