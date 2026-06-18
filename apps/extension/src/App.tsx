import { useEffect, useState } from 'react'
import { getCognitiveLogs, getStats, type Stats } from './content/storage'
import type { CognitiveEntry } from './content/types'
import './App.css'

const HYPOTHESIS_SNIPPET_LENGTH = 72

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

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      const [nextStats, logs] = await Promise.all([getStats(), getCognitiveLogs()])
      if (cancelled) return

      setStats(nextStats)
      setRecentLogs(logs.slice(-3).reverse())
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

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
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Total AI Interceptions
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50">
              {stats?.totalInterceptions ?? '—'}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Time Saved Thinking
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-zinc-50">
              {stats?.timeSavedThinking ?? '—'}
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
    </div>
  )
}

export default App
