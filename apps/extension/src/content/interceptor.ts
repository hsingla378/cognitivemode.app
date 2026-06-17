import type { PendingSubmit } from './types'

const PROMPT_INPUT_SELECTORS = [
  '#prompt-textarea',
  '[data-testid="prompt-textarea"]',
  'div#prompt-textarea[contenteditable="true"]',
  'div.ProseMirror[contenteditable="true"]',
  'div[contenteditable="true"][data-placeholder]',
  'div[role="textbox"][contenteditable="true"]',
  'textarea[placeholder*="Message"]',
  'textarea[placeholder*="message"]',
  '[data-testid="composer-textarea"]',
  'rich-textarea textarea',
]

const SEND_BUTTON_SELECTORS = [
  '[data-testid="send-button"]',
  '[data-testid="composer-send-button"]',
  'button[aria-label="Send prompt"]',
  'button[aria-label="Send message"]',
  'button[aria-label="Send Message"]',
  'button[aria-label*="Send"]',
  'button[aria-label*="send"]',
]

const COMPOSER_SELECTOR = PROMPT_INPUT_SELECTORS.join(', ')
const SEND_SELECTOR = SEND_BUTTON_SELECTORS.join(', ')

export interface InterceptorHandle {
  /** Temporarily bypass interception so a pending message can be sent. */
  unlock: (submit?: () => void) => void
  /** Tear down listeners and observers. */
  destroy: () => void
}

function isVisible(element: HTMLElement): boolean {
  if (!element.isConnected) return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

function getComposerText(input: HTMLElement): string {
  if (input instanceof HTMLTextAreaElement) {
    return input.value.trim()
  }
  return (input.innerText ?? input.textContent ?? '').trim()
}

function hasPromptContent(input: HTMLElement): boolean {
  return getComposerText(input).length > 0
}

function getComposerFromTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null
  if (target.matches(COMPOSER_SELECTOR)) return target
  return target.closest<HTMLElement>(COMPOSER_SELECTOR)
}

function findPromptInput(): HTMLElement | null {
  const focused = getComposerFromTarget(document.activeElement)
  if (focused && isVisible(focused)) return focused

  for (const selector of PROMPT_INPUT_SELECTORS) {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector))
    for (const element of elements) {
      if (isVisible(element)) return element
    }
  }

  return null
}

function findSendButton(input: HTMLElement | null): HTMLElement | null {
  const roots = [
    input?.closest('form'),
    input?.closest('[class*="composer"]'),
    input?.closest('footer'),
    input?.parentElement?.parentElement,
    input?.parentElement,
  ]

  for (const root of roots) {
    if (!root) continue
    const button = root.querySelector<HTMLElement>(SEND_SELECTOR)
    if (button) return button
  }

  return document.querySelector<HTMLElement>(SEND_SELECTOR)
}

function isSendDisabled(button: HTMLElement): boolean {
  if (button instanceof HTMLButtonElement) return button.disabled
  return button.getAttribute('aria-disabled') === 'true'
}

function createPendingSubmit(input: HTMLElement): PendingSubmit {
  const sendButton = findSendButton(input)

  return {
    input,
    trigger: () => {
      if (sendButton && !isSendDisabled(sendButton)) {
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

  const unlock = (submit?: () => void) => {
    isUnlocked = true
    submit?.()
    window.setTimeout(() => {
      isUnlocked = false
    }, 0)
  }

  const intercept = (pending: PendingSubmit) => {
    onIntercept(pending)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isUnlocked) return
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return

    const input = getComposerFromTarget(event.target)
    if (!input || !hasPromptContent(input)) return

    event.preventDefault()
    event.stopImmediatePropagation()
    intercept(createPendingSubmit(input))
  }

  const handleSendClick = (event: MouseEvent) => {
    if (isUnlocked) return

    const target = event.target
    if (!(target instanceof HTMLElement)) return

    const button = target.closest<HTMLElement>(SEND_SELECTOR)
    if (!button || isSendDisabled(button)) return

    const input = getComposerFromTarget(document.activeElement) ?? findPromptInput()
    if (!input || !hasPromptContent(input)) return

    event.preventDefault()
    event.stopImmediatePropagation()
    intercept(createPendingSubmit(input))
  }

  document.addEventListener('keydown', handleKeyDown, true)
  document.addEventListener('click', handleSendClick, true)

  const destroy = () => {
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('click', handleSendClick, true)
  }

  return { unlock, destroy }
}
