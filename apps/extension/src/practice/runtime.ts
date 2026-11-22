import { SETTINGS_KEY, getSettings, normalizeSettings, safeStorageGet, safeStorageSet } from '../content/storage.ts'
import type { Settings } from '../content/storage.ts'
import { extractProblem, isSubmitClick } from './extract.ts'
import type { ExtractedProblem } from './extract.ts'
import { createEmptyState, finishAttempt, heartbeat, problemKey, recordSubmit, resumeOrHeartbeat, visit } from './model.ts'
import { mountPill } from './mountPill'
import type { PillController } from './mountPill'
import { parseProblemUrl } from './platforms.ts'
import { onPracticeStateChange, readPracticeState, updatePracticeState } from './store.ts'
import type { Outcome, Platform, PracticeState, ProblemRecord } from './types.ts'

// Content scripts live in an isolated world and can't see the page's own history.pushState
// calls, so in-app navigation (e.g. LeetCode's "next problem") is detected by polling the URL.
const URL_POLL_MS = 1000
const HEARTBEAT_MS = 60_000
const EXTRACT_RETRY_MS = 1000
const EXTRACT_TIMEOUT_MS = 10_000
// One more read after the title shows up, in case the page swapped content after the URL changed.
const EXTRACT_SETTLE_MS = 2000
const SUBMIT_PROMPT_DELAY_MS = 4000
const PILL_COLLAPSED_KEY = 'cm_pill_collapsed'

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

function readCollapsed(value: unknown): Partial<Record<Platform, boolean>> {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(Object.entries(value).filter(([, flag]) => typeof flag === 'boolean'))
}

function sameMetadata(a: ExtractedProblem, b: ExtractedProblem): boolean {
  return a.ref.title === b.ref.title && a.ref.difficulty === b.ref.difficulty && a.statement === b.statement
}

export function initPracticeRuntime(): () => void {
  let settings: Settings = normalizeSettings(undefined)
  let state: PracticeState = createEmptyState()
  let collapsed: Partial<Record<Platform, boolean>> = {}
  let current: { key: string; platform: Platform } | null = null
  // Latest read of the current problem, kept for visits deferred until the tab is visible.
  let lastFound: ExtractedProblem | null = null
  let visitPending = false
  let lastHref = ''
  let generation = 0
  // The post-Submit prompt belongs to the problem it was submitted on.
  let autoOpen: { key: string | null; token: number } = { key: null, token: 0 }
  let pill: PillController | null = null
  let stopped = false
  const intervals: number[] = []
  const timeouts: number[] = []

  const enabled = () => settings.enabled && settings.practiceMode
  const visible = () => document.visibilityState === 'visible'

  function render() {
    if (stopped || !current || !enabled()) {
      pill?.destroy()
      pill = null
      return
    }

    pill ??= mountPill()
    const { key, platform } = current
    pill.update({
      record: state.problems[key] ?? null,
      collapsed: collapsed[platform] ?? false,
      autoOpenToken: autoOpen.key === key ? autoOpen.token : 0,
      onLog: logOutcome,
      onToggleCollapsed: () => toggleCollapsed(platform),
    })
  }

  async function logOutcome(outcome: Outcome): Promise<ProblemRecord | null> {
    if (!current) return null
    const { key } = current
    state = await updatePracticeState((practice, now) => finishAttempt(practice, key, outcome, now))
    render()
    return state.problems[key] ?? null
  }

  function toggleCollapsed(platform: Platform) {
    collapsed = { ...collapsed, [platform]: !collapsed[platform] }
    void safeStorageSet({ [PILL_COLLAPSED_KEY]: collapsed })
    render()
  }

  // Background tabs (ctrl-click, session restore) must not take over the active problem, so
  // their visit waits until the user actually looks at the tab.
  async function recordVisit(found: ExtractedProblem, run: number) {
    lastFound = found
    if (!visible()) {
      visitPending = true
      if (run === generation) render()
      return
    }

    visitPending = false
    state = await updatePracticeState((practice, now) =>
      visit(practice, found.ref, now, found.statement, { titleIsFallback: found.fromFallback }),
    )
    if (run === generation) render()
  }

  async function track(href: string) {
    const parsed = enabled() ? parseProblemUrl(href) : null
    const key = parsed ? problemKey(parsed.platform, parsed.slug) : null
    // Switching tabs within one problem (description → submissions) keeps the same session.
    if (key === (current?.key ?? null)) return

    generation += 1
    const run = generation
    current = parsed && key ? { key, platform: parsed.platform } : null
    lastFound = null
    visitPending = false
    render()

    let found = extractProblem(href, document)
    if (!found) return
    await recordVisit(found, run)

    // Titles can render after the URL changes; refresh the metadata once a real title shows up.
    const deadline = Date.now() + EXTRACT_TIMEOUT_MS
    while (found.fromFallback && Date.now() < deadline) {
      await sleep(EXTRACT_RETRY_MS)
      if (stopped || run !== generation) return
      const next = extractProblem(window.location.href, document)
      if (!next) return
      found = next
      if (!found.fromFallback) await recordVisit(found, run)
    }

    await sleep(EXTRACT_SETTLE_MS)
    if (stopped || run !== generation) return
    const settled = extractProblem(window.location.href, document)
    if (settled && !settled.fromFallback && !sameMetadata(settled, found)) await recordVisit(settled, run)
  }

  function checkUrl() {
    if (window.location.href === lastHref) return
    lastHref = window.location.href
    void track(lastHref)
  }

  async function beat() {
    if (!current || !enabled() || !visible()) return
    const { key } = current
    const found = lastFound
    const pending = visitPending
    visitPending = false

    state = await updatePracticeState((practice, now) => {
      if (!found) return heartbeat(practice, key, now)
      const options = { titleIsFallback: found.fromFallback }
      return pending
        ? visit(practice, found.ref, now, found.statement, options)
        : resumeOrHeartbeat(practice, found.ref, now, found.statement, options)
    })
    render()
  }

  const handleVisibility = () => {
    if (visible()) void beat()
  }

  const handleClick = (event: MouseEvent) => {
    if (!current || !enabled() || !isSubmitClick(current.platform, event.target)) return
    const { key } = current
    void updatePracticeState((practice, now) => recordSubmit(practice, key, now)).then((next) => {
      state = next
      render()
    })
    timeouts.push(
      window.setTimeout(() => {
        autoOpen = { key, token: autoOpen.token + 1 }
        render()
      }, SUBMIT_PROMPT_DELAY_MS),
    )
  }

  const handleSettingsChange = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'local' || !changes[SETTINGS_KEY]) return
    const wasEnabled = enabled()
    settings = normalizeSettings(changes[SETTINGS_KEY].newValue)
    if (wasEnabled === enabled()) return
    current = null
    lastHref = ''
    render()
    checkUrl()
  }

  const unsubscribeState = onPracticeStateChange((next) => {
    state = next
    render()
  })
  chrome.storage.onChanged.addListener(handleSettingsChange)
  window.addEventListener('popstate', checkUrl)
  document.addEventListener('visibilitychange', handleVisibility)
  document.addEventListener('click', handleClick, true)
  intervals.push(window.setInterval(checkUrl, URL_POLL_MS), window.setInterval(() => void beat(), HEARTBEAT_MS))

  void (async () => {
    const [loadedSettings, loadedState, stored] = await Promise.all([
      getSettings(),
      readPracticeState(),
      safeStorageGet(PILL_COLLAPSED_KEY, {}),
    ])
    settings = loadedSettings
    state = loadedState
    collapsed = readCollapsed(stored[PILL_COLLAPSED_KEY])
    if (!stopped) checkUrl()
  })()

  return () => {
    stopped = true
    intervals.forEach((id) => window.clearInterval(id))
    timeouts.forEach((id) => window.clearTimeout(id))
    unsubscribeState()
    chrome.storage.onChanged.removeListener(handleSettingsChange)
    window.removeEventListener('popstate', checkUrl)
    document.removeEventListener('visibilitychange', handleVisibility)
    document.removeEventListener('click', handleClick, true)
    pill?.destroy()
    pill = null
  }
}
