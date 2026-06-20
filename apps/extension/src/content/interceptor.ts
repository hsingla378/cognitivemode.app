import type { PendingSubmit } from './types'

export interface PlatformSelectors {
  input: string
  button: string
}

export const platformSelectors: Record<string, PlatformSelectors> = {
  'chatgpt.com': {
    input: '#prompt-textarea',
    button: 'button[data-testid="send-button"]',
  },
  'claude.ai': {
    input: 'div[contenteditable="true"].ProseMirror',
    button: 'button[aria-label="Send Message"]',
  },
  'gemini.google.com': {
    input:
      'rich-textarea .ql-editor[contenteditable="true"], rich-textarea div[contenteditable="true"], div[contenteditable="true"][role="textbox"], div[contenteditable="true"][aria-label*="prompt" i], div[contenteditable="true"][aria-label*="Enter" i]',
    button:
      'button[aria-label="Send message"], button[aria-label*="Send" i], button.send-button, button[mattooltip*="Send" i], button[data-test-id="send-button"]',
  },
  'bolt.new': {
    input: 'textarea[placeholder*="Bolt"]',
    button: 'button.bg-accent-500, button[class*="bg-accent"]',
  },
  'v0.dev': {
    input: 'textarea[name="prompt"]',
    button: 'button[type="submit"]',
  },
}

export interface InterceptorHandle {
  /** Temporarily bypass interception so a pending message can be sent. */
  unlock: (submit?: () => void) => void
  /** Clear the intercept lock when the overlay is dismissed without submitting. */
  releaseIntercept: () => void
  /** Tear down listeners and observers. */
  destroy: () => void
}

function resolvePlatform(hostname: string): PlatformSelectors | null {
  for (const [host, config] of Object.entries(platformSelectors)) {
    if (hostname === host || hostname.endsWith(`.${host}`)) {
      return config
    }
  }
  return null
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

function getComposerFromTarget(
  target: EventTarget | null,
  inputSelector: string,
): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null
  if (target.matches(inputSelector)) return target
  return target.closest<HTMLElement>(inputSelector)
}

function findPromptInput(inputSelector: string): HTMLElement | null {
  const focused = getComposerFromTarget(document.activeElement, inputSelector)
  if (focused && isVisible(focused)) return focused

  const elements = Array.from(document.querySelectorAll<HTMLElement>(inputSelector))
  for (const element of elements) {
    if (isVisible(element)) return element
  }

  return null
}

function findSendButton(
  input: HTMLElement | null,
  buttonSelector: string,
): HTMLElement | null {
  const roots = [
    input?.closest('form'),
    input?.closest('[class*="composer"]'),
    input?.closest('footer'),
    input?.parentElement?.parentElement,
    input?.parentElement,
  ]

  for (const root of roots) {
    if (!root) continue
    const button = root.querySelector<HTMLElement>(buttonSelector)
    if (button) return button
  }

  return document.querySelector<HTMLElement>(buttonSelector)
}

function isSendDisabled(button: HTMLElement): boolean {
  if (button instanceof HTMLButtonElement) return button.disabled
  return button.getAttribute('aria-disabled') === 'true'
}

function createPendingSubmit(
  input: HTMLElement,
  buttonSelector: string,
): PendingSubmit {
  const sendButton = findSendButton(input, buttonSelector)

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

const noopHandle: InterceptorHandle = {
  unlock: (submit?: () => void) => {
    submit?.()
  },
  releaseIntercept: () => {},
  destroy: () => {},
}

export function initInterceptor(onIntercept: (pending: PendingSubmit) => void): InterceptorHandle {
  const platform = resolvePlatform(window.location.hostname)
  if (!platform) return noopHandle

  const { input: inputSelector, button: buttonSelector } = platform
  let isUnlocked = false
  let isIntercepting = false

  const unlock = (submit?: () => void) => {
    isUnlocked = true
    isIntercepting = false
    submit?.()
    window.setTimeout(() => {
      isUnlocked = false
    }, 0)
  }

  const releaseIntercept = () => {
    isIntercepting = false
  }

  const intercept = (pending: PendingSubmit) => {
    if (isIntercepting) return
    isIntercepting = true
    onIntercept(pending)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isUnlocked || isIntercepting) return
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return

    const input = getComposerFromTarget(event.target, inputSelector)
    if (!input || !hasPromptContent(input)) return

    event.preventDefault()
    event.stopImmediatePropagation()
    intercept(createPendingSubmit(input, buttonSelector))
  }

  const handleSendClick = (event: MouseEvent) => {
    if (isUnlocked || isIntercepting) return

    const target = event.target
    if (!(target instanceof HTMLElement)) return

    const button = target.closest<HTMLElement>(buttonSelector)
    if (!button || isSendDisabled(button)) return

    const input =
      getComposerFromTarget(document.activeElement, inputSelector) ??
      findPromptInput(inputSelector)
    if (!input || !hasPromptContent(input)) return

    event.preventDefault()
    event.stopImmediatePropagation()
    intercept(createPendingSubmit(input, buttonSelector))
  }

  document.addEventListener('keydown', handleKeyDown, true)
  document.addEventListener('click', handleSendClick, true)

  const destroy = () => {
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('click', handleSendClick, true)
  }

  return { unlock, releaseIntercept, destroy }
}
