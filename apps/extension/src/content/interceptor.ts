import { getComposerText } from './composer.ts'
import type { PendingSubmit } from './types'

export interface PlatformSelectors {
  input: string
  button: string
  /** Chat AIs offer the practice hint ladder; app builders (v0, Bolt) only get Everyday mode. */
  hintLadder?: boolean
  /** How to send after the overlay: click the send button (default) or press Enter in the composer. */
  submitWith?: 'click' | 'enter'
}

const v0Selectors: PlatformSelectors = {
  input:
    'textarea[name="prompt"], textarea[placeholder*="Ask" i], textarea[placeholder*="follow-up" i], div[contenteditable="true"][role="textbox"]',
  button: 'button[aria-label*="send" i], button[type="submit"], button[data-testid*="send" i]',
}

export const platformSelectors: Record<string, PlatformSelectors> = {
  'chatgpt.com': {
    hintLadder: true,
    // A programmatic Send click left the sent prompt restored as ChatGPT's home draft; Enter doesn't.
    submitWith: 'enter',
    // ChatGPT replaced #prompt-textarea with a ProseMirror editor and dropped the send button's test id.
    input: 'form div.ProseMirror[contenteditable="true"], #prompt-textarea',
    button:
      'button[data-testid="send-button"], form button[type="submit"][aria-label="Send" i], button[aria-label="Send prompt" i]',
  },
  'claude.ai': {
    hintLadder: true,
    input: 'div[contenteditable="true"].ProseMirror',
    button: 'button[aria-label="Send message" i]',
  },
  'chat.deepseek.com': {
    hintLadder: true,
    // DeepSeek's send control is a div with role="button"; Enter is the main path.
    input: 'textarea[placeholder*="DeepSeek" i], textarea#chat-input',
    button: 'div[role="button"].ds-button--primary, button[aria-label*="send" i]',
  },
  'gemini.google.com': {
    hintLadder: true,
    input:
      'rich-textarea .ql-editor[contenteditable="true"], rich-textarea div[contenteditable="true"], div[contenteditable="true"][role="textbox"], div[contenteditable="true"][aria-label*="prompt" i], div[contenteditable="true"][aria-label*="Enter" i]',
    button:
      'button[aria-label="Send message"], button[aria-label*="Send" i], button.send-button, button[mattooltip*="Send" i], button[data-test-id="send-button"]',
  },
  'bolt.new': {
    input:
      'textarea[placeholder*="Bolt" i], textarea[placeholder*="help you today" i], textarea[placeholder*="/command" i], div[contenteditable="true"][role="textbox"]',
    button:
      'button[aria-label*="send" i], button[type="submit"], button.bg-accent-500, button[class*="bg-accent"]',
  },
  'v0.app': v0Selectors,
  'v0.dev': v0Selectors,
  'perplexity.ai': {
    hintLadder: true,
    input:
      'textarea[placeholder*="Ask" i], textarea[aria-label*="Ask" i], textarea[placeholder*="anything" i], div[contenteditable="true"][role="textbox"], div[contenteditable="true"][aria-label*="Ask" i]',
    // Exact "Submit": the composer also has a "Search" mode toggle that sits earlier in the DOM.
    button: 'button[aria-label="Submit" i], button[aria-label*="send" i], button[type="submit"], button[data-testid*="submit" i]',
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

export function resolvePlatform(hostname: string): PlatformSelectors | null {
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

export function createPendingSubmit(input: HTMLElement, platform: PlatformSelectors): PendingSubmit {
  return {
    input,
    trigger: () => {
      // The send button is looked up again at send time: the page may have re-rendered it.
      const sendButton = platform.submitWith === 'enter' ? null : findSendButton(input, platform.button)

      if (sendButton && sendButton.isConnected && isVisible(sendButton) && !isSendDisabled(sendButton)) {
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
    getText: () => getComposerText(input),
  }
}

const noopHandle: InterceptorHandle = {
  unlock: (submit?: () => void) => {
    submit?.()
  },
  releaseIntercept: () => {},
  destroy: () => {},
}

export interface InterceptorOptions {
  /** Called synchronously on every Enter/click, because preventDefault cannot wait for storage. */
  shouldIntercept: (input: HTMLElement) => boolean
}

export function initInterceptor(
  onIntercept: (pending: PendingSubmit) => void,
  options: InterceptorOptions,
): InterceptorHandle {
  const platform = resolvePlatform(window.location.hostname)
  if (!platform) return noopHandle

  const { input: inputSelector, button: buttonSelector } = platform
  let isUnlocked = false
  let isIntercepting = false

  const unlock = (submit?: () => void) => {
    isUnlocked = true
    isIntercepting = false
    try {
      submit?.()
    } finally {
      window.setTimeout(() => {
        isUnlocked = false
      }, 0)
    }
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
    if (!options.shouldIntercept(input)) return

    event.preventDefault()
    event.stopImmediatePropagation()
    intercept(createPendingSubmit(input, platform))
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
    if (!options.shouldIntercept(input)) return

    event.preventDefault()
    event.stopImmediatePropagation()
    intercept(createPendingSubmit(input, platform))
  }

  document.addEventListener('keydown', handleKeyDown, true)
  document.addEventListener('click', handleSendClick, true)

  const destroy = () => {
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('click', handleSendClick, true)
  }

  return { unlock, releaseIntercept, destroy }
}
