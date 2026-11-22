import { useEffect, useState, type ReactNode } from 'react'
import { getSettings, normalizeSettings, saveSettings, type Settings } from './content/storage'
import {
  activePractice,
  activeTimeMs,
  createEmptyState,
  currentAttempt,
  deriveOutcome,
  dueProblems,
  finishAttempt,
  topicReadiness,
  weeklyStats,
} from './practice/model.ts'
import { LOG_OPTIONS, formatClock, hintSummary } from './practice/pillText.ts'
import { PLATFORM_LABELS } from './practice/platforms.ts'
import { onPracticeStateChange, readPracticeState, updatePracticeState } from './practice/store.ts'
import type { Outcome, PracticeState, WeeklyStats } from './practice/types.ts'
import Toggle from './ui/Toggle'
import TopicBars from './ui/TopicBars'
import './App.css'

const FRICTION_DELAY_MIN = 5
const FRICTION_DELAY_MAX = 60
const TOP_TOPICS = 4
const DUE_PREVIEW = 5
const PRACTICE_SITES = [
  { label: 'LeetCode', url: 'https://leetcode.com/problemset/' },
  { label: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/explore' },
  { label: 'takeUforward', url: 'https://takeuforward.org/dsa' },
]

function openTab(url: string) {
  void chrome.tabs.create({ url })
}

function shareWeekUrl(stats: WeeklyStats): string {
  const text = `I solved ${stats.clean}/${stats.solved} practice problems clean this week, ${stats.streakDays}-day streak. Practicing DSA with AI hints, not answers: cognitivemode.app`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
}

function SectionLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
      {children}
    </h2>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-2">
      <p className="text-xl font-semibold tabular-nums text-zinc-50">{value}</p>
      <p className="text-[11px] text-zinc-500">{label}</p>
    </div>
  )
}

function App() {
  const [settings, setSettings] = useState<Settings>(() => normalizeSettings(undefined))
  const [practice, setPractice] = useState<PracticeState>(() => createEmptyState())
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false

    void Promise.all([getSettings(), readPracticeState()]).then(([loadedSettings, loadedPractice]) => {
      if (cancelled) return
      setSettings(loadedSettings)
      setPractice(loadedPractice)
    })
    const unsubscribe = onPracticeStateChange(setPractice)
    const tick = window.setInterval(() => setNow(Date.now()), 1000)

    return () => {
      cancelled = true
      unsubscribe()
      window.clearInterval(tick)
    }
  }, [])

  const active = activePractice(practice, now)
  const attempt = active ? currentAttempt(active) : undefined
  const due = dueProblems(practice, now)
  const stats = weeklyStats(practice, now)
  const topics = topicReadiness(practice).slice(0, TOP_TOPICS)
  const hasHistory = Object.keys(practice.problems).length > 0

  async function updateSettings(patch: Partial<Settings>) {
    setSettings((current) => normalizeSettings({ ...current, ...patch }))
    await saveSettings(patch)
  }

  async function logOutcome(outcome: Outcome) {
    if (!active) return
    const { key } = active
    setPractice(await updatePracticeState((state, time) => finishAttempt(state, key, outcome, time)))
  }

  return (
    <div className="flex h-[560px] w-[360px] flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h1 className="text-sm font-semibold tracking-tight">Cognitive Mode</h1>
        <button
          type="button"
          onClick={() => void updateSettings({ enabled: !settings.enabled })}
          aria-pressed={settings.enabled}
          title={settings.enabled ? 'Pause Cognitive Mode' : 'Turn Cognitive Mode back on'}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              settings.enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-zinc-600'
            }`}
          />
          {settings.enabled ? 'Active' : 'Paused'}
        </button>
      </header>

      <main className="popup-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
        {active && attempt && (
          <section aria-labelledby="now-practicing" className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] p-3">
            <SectionLabel id="now-practicing">Now practicing</SectionLabel>
            <button
              type="button"
              onClick={() => openTab(active.url)}
              className="block max-w-full truncate text-left text-sm font-medium text-zinc-100 hover:underline"
            >
              {active.title}
            </button>
            <p className="mt-0.5 text-xs text-zinc-500">
              {PLATFORM_LABELS[active.platform]}
              {active.difficulty ? ` · ${active.difficulty}` : ''} ·{' '}
              <span className="font-mono tabular-nums text-zinc-300">{formatClock(activeTimeMs(attempt, now, false))}</span>{' '}
              · {hintSummary(attempt.maxHintLevel)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {LOG_OPTIONS.map((option) => (
                <button
                  key={option.outcome}
                  type="button"
                  onClick={() => void logOutcome(option.outcome)}
                  className={`rounded-lg border px-2 py-1.5 text-left text-[11px] transition ${
                    option.outcome === deriveOutcome(attempt.maxHintLevel)
                      ? 'border-emerald-400/60 bg-emerald-400/10 text-zinc-100'
                      : 'border-zinc-800 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="resolve-today">
          <div className="flex items-center justify-between">
            <SectionLabel id="resolve-today">Re-solve today</SectionLabel>
            {due.length > 0 && <span className="mb-2 font-mono text-xs text-emerald-300">{due.length}</span>}
          </div>
          {due.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-800 px-3 py-3 text-xs leading-relaxed text-zinc-500">
              {hasHistory
                ? 'All caught up. Problems you needed help on come back here for a clean re-solve.'
                : 'Open a problem on a practice site to start. When you ask ChatGPT, Claude or Gemini, you pick how much help you get.'}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {due.slice(0, DUE_PREVIEW).map((record) => (
                <li key={record.key}>
                  <button
                    type="button"
                    onClick={() => openTab(record.url)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-left text-xs transition hover:border-zinc-600"
                  >
                    <span className="truncate text-zinc-200">{record.title}</span>
                    <span className="shrink-0 text-zinc-500">{PLATFORM_LABELS[record.platform]} →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!hasHistory && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRACTICE_SITES.map((site) => (
                <button
                  key={site.label}
                  type="button"
                  onClick={() => openTab(site.url)}
                  className="rounded-full border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300 transition hover:border-zinc-600"
                >
                  {site.label}
                </button>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="this-week">
          <SectionLabel id="this-week">This week</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            <Stat value={stats.clean} label="clean solves" />
            <Stat value={stats.solved} label="solved" />
            <Stat value={stats.streakDays} label="day streak" />
          </div>
        </section>

        {topics.length > 0 && (
          <section aria-labelledby="topics">
            <SectionLabel id="topics">Topics</SectionLabel>
            <TopicBars topics={topics} />
          </section>
        )}

        <details className="rounded-xl border border-zinc-800 px-3 py-2.5">
          <summary className="cursor-pointer text-xs text-zinc-400">Settings</summary>
          <div className="mt-3 space-y-3">
            <Toggle
              label="Practice mode"
              description="Hint ladder while a practice problem is open"
              checked={settings.practiceMode}
              onChange={(checked) => void updateSettings({ practiceMode: checked })}
            />
            <Toggle
              label="Everyday mode"
              description="Think-first gate on every AI prompt"
              checked={settings.everydayMode}
              onChange={(checked) => void updateSettings({ everydayMode: checked })}
            />
            {settings.everydayMode && (
              <label className="block">
                <span className="flex items-center justify-between text-[11px] text-zinc-400">
                  Everyday delay
                  <span className="font-mono tabular-nums text-zinc-200">{settings.countdownDuration}s</span>
                </span>
                <input
                  type="range"
                  min={FRICTION_DELAY_MIN}
                  max={FRICTION_DELAY_MAX}
                  step={1}
                  value={settings.countdownDuration}
                  onChange={(event) => void updateSettings({ countdownDuration: Number(event.target.value) })}
                  className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-emerald-500"
                />
              </label>
            )}
          </div>
        </details>
      </main>

      <footer className="flex items-center justify-between border-t border-zinc-800 px-4 py-3 text-xs">
        <button
          type="button"
          onClick={() => openTab(shareWeekUrl(stats))}
          disabled={stats.solved === 0}
          className="text-zinc-400 transition hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Share my week
        </button>
        <button
          type="button"
          onClick={() => openTab(chrome.runtime.getURL('history.html'))}
          className="font-medium text-zinc-300 transition hover:text-zinc-50"
        >
          Open dashboard →
        </button>
      </footer>
    </div>
  )
}

export default App
