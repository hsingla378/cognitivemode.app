import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Pin, Puzzle, Zap } from "lucide-react";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Welcome | Cognitive Mode",
  description:
    "Your Cognitive Mode extension is installed. Pin it to your toolbar and open ChatGPT or Bolt.new for your first intentional speedbump.",
};

const STEPS = [
  {
    step: "01",
    icon: Puzzle,
    title: "Open the extensions menu",
    description:
      "Click the puzzle icon in Chrome's toolbar to see your installed extensions.",
    border: "border-emerald-400/25",
    iconColor: "text-emerald-300",
    glow: "shadow-[0_0_32px_rgba(52,211,153,0.12)]",
    iconBg: "bg-emerald-400/10",
  },
  {
    step: "02",
    icon: Pin,
    title: "Pin Cognitive Mode",
    description:
      "Find Cognitive Mode in the list and pin it so it stays visible on your toolbar.",
    border: "border-amber-400/25",
    iconColor: "text-amber-300",
    glow: "shadow-[0_0_32px_rgba(251,191,36,0.1)]",
    iconBg: "bg-amber-400/10",
  },
  {
    step: "03",
    icon: Zap,
    title: "Trigger your first speedbump",
    description:
      "Open ChatGPT or Bolt.new and try to offload a problem — feel the intentional friction kick in.",
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
            Installation Complete.
            <br />
            <span className="bg-gradient-to-r from-emerald-200 via-foreground to-emerald-200 bg-clip-text text-transparent">
              Time to reclaim your brain.
            </span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Cognitive Mode is live in your browser. Three quick steps and
            you&apos;ll feel the difference the next time you reach for an AI
            shortcut.
          </p>
        </div>

        {/* 3-step guide */}
        <div className="w-full space-y-8">
          <div className="flex flex-col gap-2 sm:items-start">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              get started
            </p>
            <h2 className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Three steps. One habit shift.
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

        {/* CTAs */}
        <div className="flex w-full flex-col items-center gap-4 sm:items-start">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted/70">
            ready when you are
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <a
              href="https://chatgpt.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-400/60 bg-[rgba(16,185,129,0.08)] px-6 text-sm font-medium text-foreground shadow-[0_0_24px_rgba(16,185,129,0.35)] backdrop-blur-md transition hover:border-emerald-300 hover:bg-[rgba(16,185,129,0.15)]"
            >
              Open ChatGPT
              <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </a>
            <a
              href="https://bolt.new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border/80 bg-[rgba(24,24,27,0.85)] px-6 text-sm font-medium text-muted transition hover:border-foreground/70 hover:text-foreground"
            >
              Open Bolt.new
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
            100% Local. Zero Servers. Your thoughts stay yours.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
