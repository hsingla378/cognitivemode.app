const FEATURES = [
  {
    icon: "⏱",
    title: "Intentional Speedbumps",
    description:
      "Prevent instant code-generation offloading with customizable delay loops. Control exactly how long your brain has to sit with the problem before the AI gets involved.",
    accent: "border-amber-400/20 hover:border-amber-400/40",
    glow: "group-hover:shadow-[0_0_40px_rgba(251,191,36,0.07)]",
    label: "delay · friction · habit",
  },
  {
    icon: "🧠",
    title: "The Hypothesis Gate",
    description:
      "Force your brain to articulate what you are trying to solve before asking an LLM. Typing it out often solves the problem before you ever hit send.",
    accent: "border-emerald-400/20 hover:border-emerald-400/40",
    glow: "group-hover:shadow-[0_0_40px_rgba(52,211,153,0.07)]",
    label: "clarity · recall · depth",
  },
  {
    icon: "🔒",
    title: "100% Client-Side Privacy",
    description:
      "Built entirely on the Chrome Extension Storage API. Zero databases, zero third-party telemetry, zero external networks. Your cognitive logs never leave your machine.",
    accent: "border-blue-400/20 hover:border-blue-400/40",
    glow: "group-hover:shadow-[0_0_40px_rgba(96,165,250,0.07)]",
    label: "local · private · open source",
  },
];

export default function FeatureGrid() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-24">
      {/* Section header */}
      <div className="mb-12 flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          why it works
        </p>
        <h2 className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Three mechanisms. One goal.
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          Rebuild the habit of thinking independently — without quitting AI entirely.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className={`group flex flex-col gap-4 rounded-2xl border bg-[rgba(255,255,255,0.02)] p-6 backdrop-blur-sm transition-all duration-300 ${f.accent} ${f.glow}`}
          >
            <span className="text-2xl">{f.icon}</span>
            <div className="flex flex-col gap-2">
              <h3 className="font-mono text-sm font-semibold tracking-tight text-foreground">
                {f.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted">
                {f.description}
              </p>
            </div>
            <p className="mt-auto font-mono text-[10px] uppercase tracking-[0.18em] text-muted/40">
              {f.label}
            </p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mt-20 h-px w-full bg-gradient-to-r from-transparent via-[--color-border] to-transparent" />
    </section>
  );
}
