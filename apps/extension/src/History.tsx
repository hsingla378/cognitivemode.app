import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { getCognitiveLogs } from './content/storage'
import type { CognitiveEntry } from './content/types'
import { createEmptyState, dueProblems, topicReadiness, upcomingReviews } from './practice/model.ts'
import { formatClock } from './practice/pillText.ts'
import { PLATFORM_LABELS } from './practice/platforms.ts'
import { onPracticeStateChange, readPracticeState } from './practice/store.ts'
import type { Attempt, PracticeState, ProblemRecord } from './practice/types.ts'
import TopicBars from './ui/TopicBars'
import { OUTCOME_STYLES, formatShortDate, helpLabel, outcomeLabel } from './ui/labels.ts'
import './History.css'

type Tab = 'log' | 'resolve' | 'topics' | 'notes'

const TABS: { id: Tab; label: string }[] = [
  { id: 'log', label: 'Practice log' },
  { id: 'resolve', label: 'Re-solve' },
  { id: 'topics', label: 'Topics' },
  { id: 'notes', label: 'Notes' },
]

const LEGACY_PLATFORM_LABELS: Record<string, string> = {
  'chatgpt.com': 'ChatGPT',
  'claude.ai': 'Claude',
  'gemini.google.com': 'Gemini',
  'bolt.new': 'Bolt',
  'v0.dev': 'v0',
  'v0.app': 'v0',
  'perplexity.ai': 'Perplexity',
  'chat.deepseek.com': 'DeepSeek',
}

interface LogRow {
  id: string
  record: ProblemRecord
  attempt: Attempt
  at: number
}

function initialTab(): Tab {
  const hash = window.location.hash.slice(1)
  return TABS.some((tab) => tab.id === hash) ? (hash as Tab) : 'log'
}

function formatDateTime(timestamp: number): string {
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

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  )
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative mb-5 block">
      <span className="sr-only">{placeholder}</span>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
        <SearchIcon />
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-3.5 pl-12 pr-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-700 focus:ring-2 focus:ring-zinc-800"
      />
    </label>
  )
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-16 text-center">
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
    </div>
  )
}

function HeaderCell({ children }: { children: string }) {
  return <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-zinc-500">{children}</th>
}

function ProblemLink({ record }: { record: ProblemRecord }) {
  return (
    <a href={record.url} target="_blank" rel="noreferrer" className="font-medium text-zinc-100 hover:underline">
      {record.number ? `${record.number}. ` : ''}
      {record.title}
    </a>
  )
}

function PracticeLog({ practice }: { practice: PracticeState }) {
  const [query, setQuery] = useState('')
  const rows = useMemo<LogRow[]>(
    () =>
      Object.values(practice.problems)
        .flatMap((record) =>
          record.attempts.map((attempt, index) => ({
            id: `${record.key}#${index}`,
            record,
            attempt,
            at: attempt.endedAt ?? attempt.lastActiveAt,
          })),
        )
        .sort((a, b) => b.at - a.at),
    [practice],
  )
  const filtered = rows.filter(({ record, attempt }) =>
    fuzzyMatch(query, [record.title, PLATFORM_LABELS[record.platform], record.topics.join(' '), outcomeLabel(attempt)].join(' ')),
  )

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No practice sessions yet"
        detail="Open a problem on LeetCode, GeeksforGeeks or takeUforward and your attempts will show up here."
      />
    )
  }

  return (
    <>
      <SearchField value={query} onChange={setQuery} placeholder="Search problems, topics or results…" />
      <div className="history-scroll overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/20">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <HeaderCell>Date</HeaderCell>
              <HeaderCell>Problem</HeaderCell>
              <HeaderCell>Platform</HeaderCell>
              <HeaderCell>Result</HeaderCell>
              <HeaderCell>Help used</HeaderCell>
              <HeaderCell>Time</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ id, record, attempt, at }) => (
              <tr key={id} className="border-b border-zinc-800/70 text-sm last:border-b-0 hover:bg-zinc-900/40">
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-400">{formatDateTime(at)}</td>
                <td className="px-4 py-3">
                  <ProblemLink record={record} />
                  {record.difficulty && <span className="ml-2 text-xs text-zinc-500">{record.difficulty}</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{PLATFORM_LABELS[record.platform]}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-xs ${OUTCOME_STYLES[attempt.outcome ?? 'open']}`}
                  >
                    {outcomeLabel(attempt)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{helpLabel(attempt.maxHintLevel)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono tabular-nums text-zinc-400">
                  {formatClock(attempt.activeMs)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ReviewList({ records, emptyText }: { records: ProblemRecord[]; emptyText: string }) {
  if (records.length === 0) return <p className="text-sm text-zinc-500">{emptyText}</p>

  return (
    <ul className="divide-y divide-zinc-800/70 rounded-xl border border-zinc-800 bg-zinc-900/20">
      {records.map((record) => (
        <li key={record.key} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
          <span className="min-w-0 truncate">
            <ProblemLink record={record} />
            <span className="ml-2 text-xs text-zinc-500">{PLATFORM_LABELS[record.platform]}</span>
          </span>
          <span className="shrink-0 text-xs text-zinc-500">
            {record.review ? `Re-solve ${record.review.stage} of 3 · ${formatShortDate(record.review.dueAt)}` : ''}
          </span>
        </li>
      ))}
    </ul>
  )
}

function ResolveQueue({ practice, now }: { practice: PracticeState; now: number }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-200">Due now</h2>
        <ReviewList records={dueProblems(practice, now)} emptyText="Nothing due. Problems you needed help on come back after 3, 7 and 21 days." />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-200">Coming up</h2>
        <ReviewList records={upcomingReviews(practice, now)} emptyText="No upcoming re-solves." />
      </section>
    </div>
  )
}

function Notes() {
  const [logs, setLogs] = useState<CognitiveEntry[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    void getCognitiveLogs().then((entries) => {
      if (!cancelled) setLogs([...entries].reverse())
    })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = logs.filter((entry) =>
    fuzzyMatch(
      query,
      [entry.hypothesis, entry.tried, entry.domain, LEGACY_PLATFORM_LABELS[entry.domain.replace(/^www\./, '')] ?? ''].join(' '),
    ),
  )

  if (logs.length === 0) {
    return <EmptyState title="No notes yet" detail="Everyday mode saves what you wrote before prompting here." />
  }

  return (
    <>
      <SearchField value={query} onChange={setQuery} placeholder="Search hypotheses or what you tried…" />
      <div className="history-scroll overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/20">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <HeaderCell>Date</HeaderCell>
              <HeaderCell>Platform</HeaderCell>
              <HeaderCell>Hypothesis</HeaderCell>
              <HeaderCell>What I tried</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.timestamp} className="border-b border-zinc-800/70 last:border-b-0 hover:bg-zinc-900/40">
                <td className="whitespace-nowrap px-4 py-4 align-top text-sm tabular-nums text-zinc-400">
                  {formatDateTime(entry.timestamp)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 align-top text-xs text-zinc-300">
                  {LEGACY_PLATFORM_LABELS[entry.domain.replace(/^www\./, '')] ?? entry.domain}
                </td>
                <td className="max-w-md px-4 py-4 align-top text-sm leading-relaxed text-zinc-100">{entry.hypothesis}</td>
                <td className="max-w-md px-4 py-4 align-top text-sm leading-relaxed text-zinc-400">{entry.tried}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function DashboardPage() {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [practice, setPractice] = useState<PracticeState>(() => createEmptyState())
  const [now] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false
    void readPracticeState().then((state) => {
      if (!cancelled) setPractice(state)
    })
    const unsubscribe = onPracticeStateChange(setPractice)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  function selectTab(next: Tab) {
    setTab(next)
    window.history.replaceState(null, '', `#${next}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80">
        <div className="mx-auto w-full max-w-6xl px-6 pt-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Cognitive Mode</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">Dashboard</h1>
          <nav aria-label="Dashboard sections" className="mt-6 flex gap-1">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`rounded-t-lg border-b-2 px-4 py-2.5 text-sm transition ${
                  tab === id ? 'border-emerald-400 text-zinc-50' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {tab === 'log' && <PracticeLog practice={practice} />}
        {tab === 'resolve' && <ResolveQueue practice={practice} now={now} />}
        {tab === 'topics' &&
          (topicReadiness(practice).length ? (
            <div className="max-w-2xl">
              <TopicBars topics={topicReadiness(practice)} />
            </div>
          ) : (
            <EmptyState title="No topics yet" detail="Finish a few problems on LeetCode or GeeksforGeeks to see your clean rate per topic." />
          ))}
        {tab === 'notes' && <Notes />}
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DashboardPage />
  </StrictMode>,
)
