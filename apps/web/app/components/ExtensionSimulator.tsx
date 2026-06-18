"use client";

import { useEffect, useRef, useState } from "react";

const LAZY_TRIGGERS = [
  "write a regex",
  "fix this",
  "center a div",
  "how to center",
  "write me",
  "generate a",
  "create a",
  "make a",
];

const CHAT_MESSAGES = [
  { role: "user", text: "How do I reverse a linked list in JavaScript?" },
  {
    role: "ai",
    text: "Here's a clean iterative approach:\n\nfunction reverse(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    [curr.next, prev, curr] = [prev, curr, curr.next];\n  }\n  return prev;\n}",
  },
  { role: "user", text: "What's the time complexity?" },
  {
    role: "ai",
    text: "O(n) time, O(1) space — it visits each node once without any additional data structures.",
  },
];

const COUNTDOWN_START = 5;
const MIN_REASONING_CHARS = 10;

export default function ExtensionSimulator() {
  const [inputValue, setInputValue] = useState("");
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const [hypothesis, setHypothesis] = useState("");
  const [tried, setTried] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hypothesisLength = hypothesis.trim().length;
  const triedLength = tried.trim().length;
  const bothFilled =
    hypothesisLength >= MIN_REASONING_CHARS && triedLength >= MIN_REASONING_CHARS;
  const canUnlock = countdown === 0 && bothFilled;

  function triggerOverlay() {
    if (overlayVisible || unlocked) return;
    setOverlayVisible(true);
    setCountdown(COUNTDOWN_START);
    setHypothesis("");
    setTried("");
    setUnlocked(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    const lower = val.toLowerCase();
    const isLazy = LAZY_TRIGGERS.some((t) => lower.includes(t));
    if (isLazy) triggerOverlay();
  }

  function handleInputFocus() {
    triggerOverlay();
  }

  function handleUnlock() {
    setUnlocked(true);
    setOverlayVisible(false);
  }

  function handleSubmit() {
    if (!unlocked) return;
    setSubmitted(true);
    setInputValue("");
    setTimeout(() => {
      setSubmitted(false);
      setUnlocked(false);
    }, 2000);
  }

  function handleReset() {
    setOverlayVisible(false);
    setUnlocked(false);
    setInputValue("");
    setHypothesis("");
    setTried("");
    setCountdown(COUNTDOWN_START);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(() => {
    if (!overlayVisible) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [overlayVisible]);

  return (
    <section id="extension-simulator" className="mx-auto w-full max-w-5xl px-6 pb-32">
      <div className="mb-8 flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          try it now
        </p>
        <h2 className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Feel the friction before you install it.
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          Click into the prompt box below — just like you do on ChatGPT — and
          watch cognitivemode intercept your lazy query.
        </p>
      </div>

      {/* Browser window chrome */}
      <div className="overflow-hidden rounded-2xl border border-[--color-border] bg-[#111113] shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
        {/* Title bar */}
        <div className="flex items-center gap-3 border-b border-[--color-border] bg-[#0d0d0f] px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <div className="mx-auto flex h-6 w-56 items-center justify-center rounded-md border border-[--color-border] bg-[#09090b] px-3">
            <span className="font-mono text-[10px] text-muted">
              chatgpt.com
            </span>
          </div>
        </div>

        {/* Chat area — position:relative so overlay covers the whole window */}
        <div className="relative flex h-[380px] flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {CHAT_MESSAGES.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "ai" && (
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[--color-border] bg-[#18181b] text-[10px] font-mono text-muted">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-[rgba(255,255,255,0.06)] text-foreground"
                      : "border border-[--color-border] bg-[#0d0d0f] font-mono text-muted whitespace-pre-wrap"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input row */}
          <div className="border-t border-[--color-border] px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-[--color-border] bg-[#09090b] px-4 py-2.5">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                placeholder={
                  unlocked ? "Prompt unlocked — type away…" : "Message ChatGPT…"
                }
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted/50 outline-none"
              />
              <button
                onClick={handleSubmit}
                disabled={!unlocked}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(255,255,255,0.06)] text-muted transition disabled:opacity-30 enabled:hover:text-foreground"
              >
                ↑
              </button>
            </div>
          </div>

          {/* Glassmorphic overlay — covers the full chat area */}
          <div
            className={`absolute inset-0 z-10 flex flex-col justify-between rounded-b-2xl border-t border-[rgba(255,255,255,0.06)] bg-[rgba(9,9,11,0.88)] px-6 py-5 backdrop-blur-xl transition-all duration-300 ${
              overlayVisible
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-3 pointer-events-none"
            }`}
          >
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  cognitivemode intercepted
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-sm font-semibold tabular-nums transition-colors ${
                    countdown === 0 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {countdown > 0 ? `${countdown}s` : "✓ ready"}
                </span>
                <button
                  onClick={handleReset}
                  className="font-mono text-[10px] text-muted/50 transition hover:text-muted"
                >
                  skip
                </button>
              </div>
            </div>

            {/* Prompt: description */}
            <p className="text-xs text-muted leading-relaxed max-w-lg">
              Before you ask the AI — articulate your thinking. Both fields need at least{" "}
              {MIN_REASONING_CHARS} characters to unlock.
            </p>

            {/* Two text areas */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted/70">
                  1. What is your hypothesis?
                </label>
                <textarea
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  rows={3}
                  placeholder="I think the issue is…"
                  className="resize-none rounded-lg border border-[--color-border] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-xs text-foreground placeholder:text-muted/40 outline-none transition focus:border-zinc-500"
                />
                <p
                  className={`font-mono text-[10px] tabular-nums ${
                    hypothesisLength >= MIN_REASONING_CHARS
                      ? "text-emerald-400/70"
                      : "text-muted/40"
                  }`}
                >
                  {hypothesisLength}/{MIN_REASONING_CHARS} chars
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted/70">
                  2. What have you already tried?
                </label>
                <textarea
                  value={tried}
                  onChange={(e) => setTried(e.target.value)}
                  rows={3}
                  placeholder="I already checked…"
                  className="resize-none rounded-lg border border-[--color-border] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-xs text-foreground placeholder:text-muted/40 outline-none transition focus:border-zinc-500"
                />
                <p
                  className={`font-mono text-[10px] tabular-nums ${
                    triedLength >= MIN_REASONING_CHARS
                      ? "text-emerald-400/70"
                      : "text-muted/40"
                  }`}
                >
                  {triedLength}/{MIN_REASONING_CHARS} chars
                </p>
              </div>
            </div>

            {/* Unlock button */}
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] text-muted/40">
                {!bothFilled && countdown > 0
                  ? "Fill both fields and wait for the timer"
                  : !bothFilled
                  ? `Write ${MIN_REASONING_CHARS}+ chars in each field`
                  : countdown > 0
                  ? `${countdown}s remaining…`
                  : ""}
              </p>
              <button
                onClick={handleUnlock}
                disabled={!canUnlock}
                className="rounded-full border border-emerald-400/50 bg-[rgba(16,185,129,0.08)] px-5 py-2 font-mono text-xs font-medium text-foreground shadow-[0_0_20px_rgba(16,185,129,0.2)] transition enabled:hover:border-emerald-300 enabled:hover:bg-[rgba(16,185,129,0.15)] enabled:hover:shadow-[0_0_28px_rgba(16,185,129,0.35)] disabled:opacity-25 disabled:cursor-not-allowed"
              >
                {canUnlock ? "Unlock prompt →" : countdown > 0 ? `Wait ${countdown}s…` : "Fill both fields →"}
              </button>
            </div>
          </div>

          {/* Submitted confirmation */}
          {submitted && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-b-2xl bg-[rgba(9,9,11,0.92)] backdrop-blur-sm">
              <p className="font-mono text-xs text-emerald-400">
                ✓ Prompt submitted after deliberate thought.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
