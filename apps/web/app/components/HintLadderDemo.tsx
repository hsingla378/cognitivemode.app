"use client";

import { useState } from "react";

type Level = 1 | 2 | 3 | 4;

const LEVELS: Record<Level, { name: string; blurb: string; reply: string; code?: string }> = {
  1: {
    name: "Nudge",
    blurb: "one guiding question",
    reply:
      "If the array were sorted, what could you say about the sum when you move a pointer in from the left versus from the right?",
  },
  2: {
    name: "Approach",
    blurb: "key idea, no code",
    reply:
      "Sort first. Fix one number, then look for a pair that sums to its negative. Because the rest is sorted, two pointers moving inward find every pair in one pass, so the whole thing drops from O(n³) to O(n²).",
  },
  3: {
    name: "Outline",
    blurb: "steps, no real code",
    reply:
      "1. Sort nums.\n2. For each i (skip repeats): l = i + 1, r = n − 1.\n3. While l < r: compare nums[i] + nums[l] + nums[r] with 0 and move l or r.\n4. On a hit, record it and skip equal neighbours.\nTime O(n²), extra space O(1).",
  },
  4: {
    name: "Solution",
    blurb: "full answer (assisted)",
    reply: "Here's the full approach. Quick check before you move on: why do we skip equal values right after recording a triplet?",
    code: "nums.sort()\nfor i in range(len(nums) - 2):\n    if i and nums[i] == nums[i - 1]:\n        continue\n    l, r = i + 1, len(nums) - 1\n    while l < r:\n        s = nums[i] + nums[l] + nums[r]\n        ...",
  },
};

const ORDER: Level[] = [1, 2, 3, 4];

export default function HintLadderDemo() {
  const [level, setLevel] = useState<Level | null>(null);
  const selected = level ? LEVELS[level] : null;

  return (
    <section id="demo" aria-labelledby="demo-title" className="mx-auto w-full max-w-5xl px-6 pb-28">
      <div className="mb-8 flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">try it</p>
        <h2 id="demo-title" className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          You&apos;re stuck on 3Sum. You ask ChatGPT.
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted">
          Instead of the answer appearing instantly, you pick how much help you actually want. Click a level.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-[rgba(255,255,255,0.02)]">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 font-mono text-[11px] text-muted">
          <span className="truncate">chatgpt.com · practicing LeetCode 15. 3Sum (Medium) · 14 min in</span>
          <span className="hidden shrink-0 sm:inline">practice mode</span>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[rgba(255,255,255,0.08)] px-4 py-2.5 text-sm text-foreground">
            My nested loops time out on big inputs. What am I missing?
          </div>

          <div className="rounded-2xl border border-emerald-400/30 bg-[rgba(9,9,11,0.9)] p-4 shadow-[0_0_40px_rgba(16,185,129,0.08)] sm:p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">practice mode</p>
            <p id="demo-question" className="mt-1 text-sm text-foreground">
              How much help do you want?
            </p>
            <div role="radiogroup" aria-labelledby="demo-question" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ORDER.map((option) => {
                const active = level === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setLevel(option)}
                    className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? option === 4
                          ? "border-amber-400/60 bg-amber-400/10"
                          : "border-emerald-400/60 bg-emerald-400/10"
                        : "border-border hover:border-foreground/40"
                    }`}
                  >
                    <span className="text-sm font-medium text-foreground">
                      <span className="mr-1.5 font-mono text-[10px] text-muted">{option}</span>
                      {LEVELS[option].name}
                    </span>
                    <span className="text-[11px] leading-snug text-muted">{LEVELS[option].blurb}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div aria-live="polite">
            {selected ? (
              <div className="max-w-[92%] space-y-3 text-sm leading-relaxed text-foreground/90">
                <p className="whitespace-pre-line">{selected.reply}</p>
                {selected.code && (
                  <pre className="overflow-x-auto rounded-xl border border-border bg-[rgba(0,0,0,0.4)] p-4 font-mono text-xs text-muted">
                    {selected.code}
                  </pre>
                )}
                <p className="font-mono text-[11px] text-muted">
                  {level !== null && level >= 3
                    ? "An outline or the solution counts as needing the solution. 3Sum comes back in 3 days for a clean re-solve."
                    : "Logged as a hint. Solve it from here and it counts as solved with hints."}
                </p>
              </div>
            ) : (
              <p className="font-mono text-[11px] text-muted">Pick a level to see the reply.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
