import type { Metadata } from "next";
import Link from "next/link";
import { Code, ExternalLink, MessageSquare, Pin } from "lucide-react";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Welcome | Cognitive Mode",
  description:
    "Cognitive Mode is installed. Pin it, open a problem on LeetCode, GeeksforGeeks or takeUforward, and pick a hint level the next time you ask AI for help.",
};

const STEPS = [
  {
    step: "01",
    icon: Pin,
    title: "Pin Cognitive Mode",
    description:
      "Click the puzzle icon in Chrome's toolbar and pin Cognitive Mode. Its badge shows how many re-solves are due today.",
    border: "border-emerald-400/25",
    iconColor: "text-emerald-300",
    glow: "shadow-[0_0_32px_rgba(52,211,153,0.12)]",
    iconBg: "bg-emerald-400/10",
  },
  {
    step: "02",
    icon: Code,
    title: "Open a problem",
    description:
      "Any problem on LeetCode, GeeksforGeeks or takeUforward. A small practice timer appears in the bottom-left corner.",
    border: "border-amber-400/25",
    iconColor: "text-amber-300",
    glow: "shadow-[0_0_32px_rgba(251,191,36,0.1)]",
    iconBg: "bg-amber-400/10",
  },
  {
    step: "03",
    icon: MessageSquare,
    title: "Ask your AI, pick a hint level",
    description:
      "Ask ChatGPT, Claude, Gemini, Perplexity or DeepSeek as usual, then choose a nudge, the approach, an outline or the full solution.",
    border: "border-blue-400/25",
    iconColor: "text-blue-300",
    glow: "shadow-[0_0_32px_rgba(96,165,250,0.1)]",
    iconBg: "bg-blue-400/10",
  },
];

export default function WelcomePage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Ambient celebration glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.22),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-40 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-64 h-48 w-48 rounded-full bg-amber-400/8 blur-3xl"
      />

      <section className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-14 px-6 pt-32 pb-20 text-center sm:items-start sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(20,83,45,0.12))] px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-100 shadow-[0_0_28px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,1)]" />
          installation complete
        </div>

        <div className="space-y-6">
          <h1 className="max-w-4xl font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            You&apos;re set up.
            <br />
            <span className="bg-gradient-to-r from-emerald-200 via-foreground to-emerald-200 bg-clip-text text-transparent">
              Now practice for real.
            </span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Three steps, then keep practicing exactly the way you do now. Cognitive
            Mode only steps in when you ask an AI about the problem you&apos;re on.
          </p>
        </div>

        <div className="w-full space-y-8">
          <div className="flex flex-col gap-2 sm:items-start">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              get started
            </p>
            <h2 className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Three steps. No setup beyond this.
            </h2>
          </div>

          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STEPS.map((item, index) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.step}
                  className={`group relative flex flex-col gap-5 rounded-2xl border bg-[rgba(255,255,255,0.03)] p-6 text-left backdrop-blur-sm transition-all duration-300 hover:bg-[rgba(255,255,255,0.05)] ${item.border} ${item.glow}`}
                >
                  {index < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-3 top-1/2 hidden h-px w-6 -translate-y-1/2 bg-gradient-to-r from-border/80 to-transparent sm:block"
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted/50">
                      step {item.step}
                    </span>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 ${item.iconBg}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${item.iconColor}`}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="font-mono text-sm font-semibold tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted">
                      {item.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex w-full flex-col items-center gap-4 sm:items-start">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted/70">
            ready when you are
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <a
              href="https://leetcode.com/problems/two-sum/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-400/60 bg-[rgba(16,185,129,0.08)] px-6 text-sm font-medium text-foreground shadow-[0_0_24px_rgba(16,185,129,0.35)] backdrop-blur-md transition hover:border-emerald-300 hover:bg-[rgba(16,185,129,0.15)]"
            >
              Try it on Two Sum
              <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </a>
            <a
              href="https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border/80 bg-[rgba(24,24,27,0.85)] px-6 text-sm font-medium text-muted transition hover:border-foreground/70 hover:text-foreground"
            >
              Striver&apos;s A2Z sheet
              <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </a>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border/80 bg-[rgba(24,24,27,0.85)] px-5 text-sm font-medium text-muted transition hover:border-foreground/70 hover:text-foreground"
            >
              Back to home
            </Link>
          </div>
          <p className="text-[11px] text-muted/80">
            Free. No API key. Nothing leaves your browser.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
