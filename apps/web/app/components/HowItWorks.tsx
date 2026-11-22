const STEPS = [
  {
    title: "Open a problem",
    body: "On LeetCode, GeeksforGeeks or takeUforward. A small timer starts in the corner. Nothing else changes.",
  },
  {
    title: "Ask your AI like you always do",
    body: "ChatGPT, Claude, Gemini, Perplexity or DeepSeek. Cognitive Mode asks how much help you want: a nudge, the approach, an outline or the full solution.",
  },
  {
    title: "Solve it and log it",
    body: "After you submit, one tap: solved clean, solved with hints, needed the solution, or didn't solve.",
  },
  {
    title: "Re-solve what needed help",
    body: "Those problems come back after 3, 7 and 21 days. Solve one clean and it's locked in.",
  },
];

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="mx-auto w-full max-w-5xl px-6 pb-28">
      <div className="mb-10 flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">how it works</p>
        <h2 id="how-title" className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Use AI the way a good mentor would.
        </h2>
      </div>
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3 rounded-2xl border border-border bg-[rgba(255,255,255,0.02)] p-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">
              step {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
