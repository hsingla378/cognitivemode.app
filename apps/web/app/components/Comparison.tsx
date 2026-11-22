import { Check, Minus } from "lucide-react";

const OPTIONS = ["Blocking AI", "Study modes", "Paid AI tutors", "Cognitive Mode"] as const;

const ROWS: { label: string; values: [boolean, boolean, boolean, boolean] }[] = [
  { label: "Works with the AI you already use", values: [false, false, false, true] },
  { label: "You choose how much help, per question", values: [false, false, true, true] },
  { label: "Brings problems back for a clean re-solve", values: [false, false, false, true] },
  { label: "Free, no API key, no account", values: [true, true, false, true] },
  { label: "Your practice history stays in your browser", values: [true, false, false, true] },
];

export default function Comparison() {
  return (
    <section aria-labelledby="compare-title" className="mx-auto w-full max-w-5xl px-6 pb-28">
      <div className="mb-8 flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">why not just…</p>
        <h2 id="compare-title" className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Blocking AI doesn&apos;t teach you. Neither does copy-paste.
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Interviews and online assessments are still AI-free. The goal isn&apos;t to avoid AI while you practice. It&apos;s to
          only take the help you need, and to come back until you don&apos;t need it.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="px-4 py-3 font-normal text-muted">
                <span className="sr-only">Feature</span>
              </th>
              {OPTIONS.map((option) => (
                <th
                  key={option}
                  scope="col"
                  className={`px-4 py-3 text-center font-mono text-[11px] uppercase tracking-wide ${
                    option === "Cognitive Mode" ? "text-emerald-300" : "text-muted"
                  }`}
                >
                  {option}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-b border-border/60 last:border-b-0">
                <th scope="row" className="px-4 py-3 font-normal text-foreground/90">
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td key={OPTIONS[index]} className="px-4 py-3 text-center">
                    {value ? (
                      <Check aria-label="Yes" className="mx-auto h-4 w-4 text-emerald-300" />
                    ) : (
                      <Minus aria-label="No" className="mx-auto h-4 w-4 text-muted/50" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
