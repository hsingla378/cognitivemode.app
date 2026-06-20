"use client";

import { useEffect, useState } from "react";
import ExtensionSimulator from "./components/ExtensionSimulator";
import FeatureGrid from "./components/FeatureGrid";
import Footer from "./components/Footer";

function isExtensionInstalled(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.querySelector(
      'meta[name="cognitivemode-extension"][content="installed"]',
    ) !== null
  );
}

export default function Home() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isExtensionInstalled());
  }, []);

  return (
    <main className="flex min-h-screen flex-col justify-center">
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-6 pt-32 pb-20 text-center sm:items-start sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-[rgba(24,24,27,0.85)] px-4 py-1 text-[11px] font-mono uppercase tracking-[0.22em] text-muted shadow-[0_0_0_1px_rgba(24,24,27,0.6)] backdrop-blur-md">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
          cognitive&nbsp;mode: <span className="font-semibold text-foreground">on</span>
        </div>

        <div className="space-y-6">
          <h1 className="max-w-3xl font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Your AI is doing the thinking.
            <br />
            <span className="text-muted">
              You&apos;re just doing the typing.
            </span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Break the cycle of mindless prompt-engineering. Introduce intentional
            friction into your development workflow to rebuild your cognitive
            problem-solving muscles.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
          {isInstalled ? (
            <span
              aria-disabled="true"
              className="inline-flex h-11 cursor-default items-center justify-center rounded-full border border-emerald-400/70 bg-[rgba(16,185,129,0.06)] px-6 text-sm font-medium text-emerald-300/90 opacity-90"
            >
              Extension Installed ✓
            </span>
          ) : (
            <a
              href="https://github.com/hsingla378/cognitivemode/tree/master/apps/extension#local-chrome-install"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-full border border-emerald-400/60 bg-[rgba(16,185,129,0.08)] px-6 text-sm font-medium text-foreground shadow-[0_0_24px_rgba(16,185,129,0.4)] backdrop-blur-md transition hover:border-emerald-300 hover:bg-[rgba(16,185,129,0.15)]"
            >
              Add to Chrome — It&apos;s Free
            </a>
          )}
          <a
            href="#extension-simulator"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border/80 bg-[rgba(24,24,27,0.85)] px-5 text-sm font-medium text-muted transition hover:border-foreground/70 hover:text-foreground"
          >
            Try the friction demo
          </a>
          <a
            href="https://github.com/hsingla378/cognitivemode"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border/80 bg-[rgba(24,24,27,0.85)] px-5 text-sm font-medium text-muted transition hover:border-foreground/70 hover:text-foreground"
          >
            View Source
          </a>
        </div>

        <p className="text-[11px] text-muted/80">
          100% Local. Zero Servers. Your thoughts stay yours.
        </p>
      </section>

      <ExtensionSimulator />
      <FeatureGrid />
      <Footer />
    </main>
  );
}
