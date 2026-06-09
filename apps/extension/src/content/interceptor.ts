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

function isPromptInput(element: Element | null): element is HTMLElement {
  if (!element || !(element instanceof HTMLElement)) return false
  if (element.matches(PROMPT_INPUT_SELECTORS.join(', '))) return true
  return element.closest(PROMPT_INPUT_SELECTORS.join(', ')) !== null
}

function resolvePromptInput(element: Element | null): HTMLElement | null {
  if (!element) return null
  if (element instanceof HTMLElement && element.matches(PROMPT_INPUT_SELECTORS.join(', '))) {
    return element
  }
  const closest = element.closest<HTMLElement>(PROMPT_INPUT_SELECTORS.join(', '))
  return closest
}

function findSendButton(input: HTMLElement): HTMLButtonElement | null {
  const roots = [input.closest('form'), input.closest('[class*="composer"]'), input.parentElement?.parentElement, input.parentElement]
  for (const root of roots) {
    if (!root) continue
    const button = root.querySelector<HTMLButtonElement>(SEND_BUTTON_SELECTORS.join(', '))
    if (button) return button
  }
  return document.querySelector<HTMLButtonElement>(SEND_BUTTON_SELECTORS.join(', '))
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

function hasPromptContent(input: HTMLElement): boolean {
  if (input instanceof HTMLTextAreaElement) {
    return input.value.trim().length > 0
  }
  return (input.textContent?.trim().length ?? 0) > 0
}

function resolveSendButton(element: Element | null): HTMLButtonElement | null {
  if (!element) return null
  if (element instanceof HTMLButtonElement && element.matches(SEND_BUTTON_SELECTORS.join(', '))) {
    return element
  }
  return element.closest<HTMLButtonElement>(SEND_BUTTON_SELECTORS.join(', '))
}

export function initInterceptor(onIntercept: (pending: PendingSubmit) => void): () => void {
  let isResubmitting = false
  let activeInput: HTMLElement | null = null

  const allowSubmit = (trigger: () => void) => {
    isResubmitting = true
    trigger()
    window.setTimeout(() => {
      isResubmitting = false
      activeInput = null
    }, 0)
  }

  const intercept = (pending: PendingSubmit) => {
    activeInput = pending.input
    onIntercept({
      ...pending,
      trigger: () => allowSubmit(pending.trigger),
    })
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isResubmitting) return
    if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
      return
    }

    const input = resolvePromptInput(event.target as Element)
    if (!input || !isPromptInput(input) || !hasPromptContent(input)) return

    event.preventDefault()
    event.stopImmediatePropagation()
    intercept(createPendingSubmit(input))
  }

  const handleClick = (event: MouseEvent) => {
    if (isResubmitting) return

    const button = resolveSendButton(event.target as Element)
    if (!button || button.disabled) return

    const input =
      activeInput ??
      resolvePromptInput(document.activeElement) ??
      resolvePromptInput(button.closest('form')) ??
      document.querySelector<HTMLElement>(PROMPT_INPUT_SELECTORS.join(', '))

    if (!input) return

    if (!hasPromptContent(input)) return

    event.preventDefault()
    event.stopImmediatePropagation()
    intercept(createPendingSubmit(input))
  }

  const handleFocusIn = (event: FocusEvent) => {
    const input = resolvePromptInput(event.target as Element)
    if (input) activeInput = input
  }

  document.addEventListener('keydown', handleKeyDown, true)
  document.addEventListener('click', handleClick, true)
  document.addEventListener('focusin', handleFocusIn, true)

  const observer = new MutationObserver(() => {
    const input = document.querySelector<HTMLElement>(PROMPT_INPUT_SELECTORS.join(', '))
    if (input && document.activeElement === input) {
      activeInput = input
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })

  return () => {
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('click', handleClick, true)
    document.removeEventListener('focusin', handleFocusIn, true)
    observer.disconnect()
  }
}
