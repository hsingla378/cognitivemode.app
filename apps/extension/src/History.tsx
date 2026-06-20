import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { getCognitiveLogs } from './content/storage'
import type { CognitiveEntry } from './content/types'
import './History.css'

const PLATFORM_LABELS: Record<string, string> = {
  'chatgpt.com': 'ChatGPT',
  'claude.ai': 'Claude',
  'gemini.google.com': 'Gemini',
  'bolt.new': 'Bolt',
  'v0.dev': 'v0',
  'cognitivemode.app': 'Cognitive Mode',
  'localhost': 'Localhost',
}

function formatPlatform(domain: string): string {
  const normalized = domain.replace(/^www\./, '')
  return PLATFORM_LABELS[normalized] ?? normalized
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function fuzzyMatch(query: string, text: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true

  const haystack = text.toLowerCase()
  let needleIndex = 0

  for (let i = 0; i < haystack.length && needleIndex < needle.length; i += 1) {
    if (haystack[i] === needle[needleIndex]) {
      needleIndex += 1
    }
  }

  return needleIndex === needle.length
}

function entryMatchesQuery(entry: CognitiveEntry, query: string): boolean {
  const searchable = [
    entry.hypothesis,
    entry.tried,
    entry.domain,
    formatPlatform(entry.domain),
    formatDate(entry.timestamp),
  ].join(' ')

  return fuzzyMatch(query, searchable)
}

export function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-zinc-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  )
}

export function HistoryPage() {
  const [logs, setLogs] = useState<CognitiveEntry[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadLogs() {
      const entries = await getCognitiveLogs()
      if (cancelled) return
      setLogs([...entries].reverse())
      setLoading(false)
    }

    void loadLogs()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredLogs = useMemo(
    () => logs.filter((entry) => entryMatchesQuery(entry, query)),
    [logs, query],
  )

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                Cognitive Mode
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
                Knowledge Base
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {loading
                  ? 'Loading saved hypotheses…'
                  : `${logs.length} ${logs.length === 1 ? 'entry' : 'entries'} saved locally`}
              </p>
            </div>
            {!loading && (
              <p className="text-sm tabular-nums text-zinc-500">
                {filteredLogs.length} shown
              </p>
            )}
          </div>

          <label className="group relative block">
            <span className="sr-only">Search cognitive logs</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search hypotheses, platforms, or what you tried…"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-4 pl-12 pr-4 text-base text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-zinc-700 focus:bg-zinc-900 focus:ring-2 focus:ring-zinc-800"
              autoFocus
            />
          </label>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-6">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-zinc-500">Loading your cognitive logs…</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-800 px-6 py-16 text-center">
            <div>
              <p className="text-sm font-medium text-zinc-300">
                {query.trim() ? 'No matching entries' : 'No hypotheses logged yet'}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {query.trim()
                  ? 'Try a different search term or clear the filter.'
                  : 'Your saved hypotheses will appear here after you intercept a prompt.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="history-scroll overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/20">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Platform
                    </th>
                    <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      Hypothesis
                    </th>
                    <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                      What I Tried
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((entry) => (
                    <tr
                      key={entry.timestamp}
                      className="border-b border-zinc-800/70 transition hover:bg-zinc-900/40 last:border-b-0"
                    >
                      <td className="whitespace-nowrap px-4 py-4 align-top text-sm tabular-nums text-zinc-400">
                        {formatDate(entry.timestamp)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 align-top">
                        <span className="inline-flex rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-xs font-medium text-zinc-300">
                          {formatPlatform(entry.domain)}
                        </span>
                      </td>
                      <td className="max-w-md px-4 py-4 align-top text-sm leading-relaxed text-zinc-100">
                        {entry.hypothesis}
                      </td>
                      <td className="max-w-md px-4 py-4 align-top text-sm leading-relaxed text-zinc-400">
                        {entry.tried}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HistoryPage />
  </StrictMode>,
)
