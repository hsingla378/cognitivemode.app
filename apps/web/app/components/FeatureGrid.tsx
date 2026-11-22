const FEATURES = [
  {
    icon: "🪜",
    title: "A hint ladder, not an answer key",
    description:
      "Nudge, approach, outline or full solution. You choose how much help each question gets, and the AI you already use sticks to it.",
    accent: "border-emerald-400/20 hover:border-emerald-400/40",
    label: "generation · effort · insight",
  },
  {
    icon: "🔁",
    title: "Re-solve until it's yours",
    description:
      "Problems you needed help on come back after 3, 7 and 21 days. Spaced retrieval is how solutions move from 'I've seen this' to 'I can write this'.",
    accent: "border-amber-400/20 hover:border-amber-400/40",
    label: "spacing · recall · readiness",
  },
  {
    icon: "🔒",
    title: "Stays in your browser",
    description:
      "No account, no API key, no servers. Practice history lives in Chrome's local extension storage, and the only thing an AI ever sees is the message you send.",
    accent: "border-blue-400/20 hover:border-blue-400/40",
    label: "local · private · free",
  },
];

export default function FeatureGrid() {
  return (
    <section aria-labelledby="features-title" className="mx-auto w-full max-w-5xl px-6 pb-28">
      <div className="mb-12 flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">why it works</p>
        <h2 id="features-title" className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Practice that survives the interview.
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          Attempting first and retrieving later builds the skill. Instant answers skip both.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className={`group flex flex-col gap-4 rounded-2xl border bg-[rgba(255,255,255,0.02)] p-6 transition ${feature.accent}`}
          >
            <span aria-hidden className="text-2xl">
              {feature.icon}
            </span>
            <h3 className="font-mono text-sm font-semibold tracking-tight text-foreground">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{feature.description}</p>
            <p className="mt-auto font-mono text-[10px] uppercase tracking-[0.18em] text-muted/60">{feature.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
