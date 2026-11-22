import { activePractice, createEmptyState, recordHint, setApproach } from '../practice/model.ts'
import { isPracticeHost } from '../practice/platforms.ts'
import { hasPromptMarker } from '../practice/prompt.ts'
import { initPracticeRuntime } from '../practice/runtime'
import { onPracticeStateChange, readPracticeState, updatePracticeState } from '../practice/store.ts'
import type { PracticeState } from '../practice/types.ts'
import { appendToComposer, getComposerText } from './composer.ts'
import { sendAsIs, sendWithHint } from './hintSend.ts'
import { initInterceptor, resolvePlatform, type InterceptorHandle } from './interceptor'
import { mountOverlay } from './mount'
import {
  SETTINGS_KEY,
  getSettings,
  normalizeSettings,
  recordGateTriggered,
  recordSelfSolved,
  saveCognitiveLog,
  type Settings,
} from './storage'
import type { OverlayController, OverlayView, PendingSubmit } from './types'

const EXTENSION_META_NAME = 'cognitivemode-extension'
const EXTENSION_READY_EVENT = 'cognitivemode:ready'

// The interceptor decides synchronously, so settings and practice state are cached here and
// kept fresh from storage change events.
let settings: Settings = normalizeSettings(undefined)
let practiceState: PracticeState = createEmptyState()
let pending: { submit: PendingSubmit; view: OverlayView } | null = null
let overlay: OverlayController | null = null
let interceptor: InterceptorHandle | null = null

function isLandingPage(): boolean {
  const { hostname } = window.location
  return hostname === 'cognitivemode.app' || hostname === 'localhost'
}

function injectExtensionMetaTag(): void {
  if (document.querySelector(`meta[name="${EXTENSION_META_NAME}"]`)) return

  const meta = document.createElement('meta')
  meta.name = EXTENSION_META_NAME
  meta.content = 'installed'
  document.head.appendChild(meta)
}

function dispatchExtensionReadyEvent(): void {
  window.dispatchEvent(new CustomEvent(EXTENSION_READY_EVENT))
}

const offersHintLadder = resolvePlatform(window.location.hostname)?.hintLadder === true

function currentView(input: HTMLElement): OverlayView | null {
  if (!settings.enabled) return null
  // A prompt that already carries a hint level (e.g. pasted after the copy fallback) goes through.
  if (hasPromptMarker(getComposerText(input))) return null

  const problem = settings.practiceMode && offersHintLadder ? activePractice(practiceState, Date.now()) : null
  if (problem) return { mode: 'practice', problem }
  return settings.everydayMode ? { mode: 'everyday' } : null
}

function takePending() {
  const current = pending
  pending = null
  return current
}

// Lets the chat editor commit the inserted text and enable its send button before we click it.
function afterTwoFrames(callback: () => void): void {
  requestAnimationFrame(() => requestAnimationFrame(callback))
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function startAiTab(): void {
  overlay = mountOverlay({
    async onSubmit({ hypothesis, tried, durationSeconds }) {
      const current = takePending()
      await saveCognitiveLog(hypothesis, tried, durationSeconds)
      interceptor?.unlock(current?.submit.trigger)
    },
    async onSelfSolved({ hypothesis }) {
      takePending()
      await recordSelfSolved(hypothesis)
      interceptor?.releaseIntercept()
    },
    onDismiss() {
      const current = takePending()
      interceptor?.releaseIntercept()
      // Keyboard users land back in the composer they were typing in.
      current?.submit.input.focus()
    },
    async onSendWithHint(level, approach) {
      const current = pending
      if (!current || current.view.mode !== 'practice') return 'failed'

      const { submit } = current
      const { problem } = current.view
      return sendWithHint(
        {
          append: (text) => appendToComposer(submit.input, text),
          copy: copyText,
          record: async (hintLevel, note) => {
            await updatePracticeState((state, now) =>
              recordHint(setApproach(state, problem.key, note, now), problem.key, hintLevel, now),
            )
          },
          send: () => {
            takePending()
            afterTwoFrames(() => interceptor?.unlock(submit.trigger))
          },
          release: () => interceptor?.releaseIntercept(),
        },
        { userText: submit.getText(), problem, level, approach },
      )
    },
    onSendAsIs() {
      const current = takePending()
      if (current) sendAsIs({ send: () => interceptor?.unlock(current.submit.trigger) })
    },
  })

  interceptor = initInterceptor(
    (submit) => {
      const view = currentView(submit.input)
      if (!view) {
        interceptor?.releaseIntercept()
        return
      }
      pending = { submit, view }
      if (view.mode === 'everyday') void recordGateTriggered()
      overlay?.show(submit, view)
    },
    { shouldIntercept: (input) => currentView(input) !== null },
  )
}

async function syncCaches(): Promise<void> {
  ;[settings, practiceState] = await Promise.all([getSettings(), readPracticeState()])

  onPracticeStateChange((state) => {
    practiceState = state
  })
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[SETTINGS_KEY]) {
      settings = normalizeSettings(changes[SETTINGS_KEY].newValue)
    }
  })
}

async function init() {
  const { hostname } = window.location

  if (isLandingPage()) {
    injectExtensionMetaTag()
    dispatchExtensionReadyEvent()
    console.debug('[Cognitive Mode] extension handshake active')
    return
  }

  if (isPracticeHost(hostname)) {
    initPracticeRuntime()
    return
  }

  if (!resolvePlatform(hostname)) return

  await syncCaches()
  startAiTab()
  console.debug('[Cognitive Mode] content script active')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  void init()
}
