import type { TopicReadiness } from '../practice/types.ts'

interface TopicBarsProps {
  topics: TopicReadiness[]
}

export default function TopicBars({ topics }: TopicBarsProps) {
  return (
    <ul className="space-y-2">
      {topics.map(({ topic, attempted, clean }) => {
        const percent = attempted ? Math.round((clean / attempted) * 100) : 0
        return (
          <li key={topic}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate text-zinc-300">{topic}</span>
              <span className="shrink-0 font-mono tabular-nums text-zinc-500">
                {clean}/{attempted} clean
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-zinc-800"
              role="progressbar"
              aria-label={`${topic} clean rate`}
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-emerald-400/80" style={{ width: `${percent}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
