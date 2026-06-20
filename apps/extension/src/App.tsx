import { useEffect, useState } from 'react'
import {
  getCognitiveLogs,
  getSettings,
  getStats,
  saveSettings,
  type Stats,
} from './content/storage'
import type { CognitiveEntry } from './content/types'
import './App.css'

const HYPOTHESIS_SNIPPET_LENGTH = 72
const FRICTION_DELAY_MIN = 5
const FRICTION_DELAY_MAX = 60
const FRICTION_DELAY_DEFAULT = 15

function truncateHypothesis(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length <= HYPOTHESIS_SNIPPET_LENGTH) return trimmed
  return `${trimmed.slice(0, HYPOTHESIS_SNIPPET_LENGTH).trimEnd()}…`
}

function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function App() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentLogs, setRecentLogs] = useState<CognitiveEntry[]>([])
  const [frictionDelay, setFrictionDelay] = useState(FRICTION_DELAY_DEFAULT)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      const [nextStats, logs, settings] = await Promise.all([
        getStats(),
        getCognitiveLogs(),
        getSettings(),
      ])
      if (cancelled) return

      setStats(nextStats)
      setRecentLogs(logs.slice(-3).reverse())
      setFrictionDelay(
        Math.min(FRICTION_DELAY_MAX, Math.max(FRICTION_DELAY_MIN, settings.countdownDuration)),
      )
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleFrictionDelayChange(value: number) {
    const clamped = Math.min(FRICTION_DELAY_MAX, Math.max(FRICTION_DELAY_MIN, value))
    setFrictionDelay(clamped)
    await saveSettings({ countdownDuration: clamped })
  }

  return (
    <div className="flex h-96 w-80 flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h1 className="text-sm font-semibold tracking-tight">Cognitive Mode</h1>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          Active
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4">
        <section className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Intercepted
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50">
              {stats?.totalInterceptions ?? '—'}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Think Time
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-zinc-50">
              {stats?.timeSavedThinking ?? '—'}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Streak
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50">
              {stats?.activeStreak ?? '—'}
            </p>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col">
          <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Recent Activity
          </h2>
          <ul className="activity-feed min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {recentLogs.length === 0 ? (
              <li className="rounded-md border border-dashed border-zinc-800 px-3 py-4 text-center text-xs text-zinc-500">
                No hypotheses logged yet.
              </li>
            ) : (
              recentLogs.map((log) => (
                <li
                  key={log.timestamp}
                  className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2"
                >
                  <time className="text-[11px] text-zinc-500">
                    {formatTimestamp(log.timestamp)}
                  </time>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                    {truncateHypothesis(log.hypothesis)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>

      <footer className="border-t border-zinc-800 px-4 py-3">
        <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Settings
        </h2>
        <label htmlFor="friction-delay" className="flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-400">Friction Delay</span>
          <span className="font-mono text-xs tabular-nums text-zinc-200">{frictionDelay}s</span>
        </label>
        <input
          id="friction-delay"
          type="range"
          min={FRICTION_DELAY_MIN}
          max={FRICTION_DELAY_MAX}
          step={1}
          value={frictionDelay}
          onChange={(e) => void handleFrictionDelayChange(Number(e.target.value))}
          className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-emerald-500"
        />
        <p className="mt-1.5 text-[10px] text-zinc-600">
          {FRICTION_DELAY_MIN}–{FRICTION_DELAY_MAX} seconds before unlock
        </p>
      </footer>
    </div>
  )
}

export default App
