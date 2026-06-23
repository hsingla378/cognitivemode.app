"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Bug, Gauge, Settings2, Sparkles } from "lucide-react";

const FEEDBACK_EMAIL = "hsingla378@gmail.com";

const REASONS = [
  {
    label: "Too much friction?",
    value: "Too much friction",
    icon: Gauge,
  },
  {
    label: "Buggy?",
    value: "Buggy",
    icon: Bug,
  },
  {
    label: "Didn't work on my AI tool",
    value: "Unsupported tool",
    icon: Sparkles,
  },
  {
    label: "Missing controls",
    value: "Missing controls",
    icon: Settings2,
  },
];

function buildGmailComposeUrl(reason: string, notes: string): string {
  const body = [
    "Cognitive Mode uninstall feedback",
    "",
    `Reason: ${reason || "Not selected"}`,
    "",
    "Notes:",
    notes.trim() || "No notes provided.",
  ].join("\n");

  const url = new URL("https://mail.google.com/mail/?view=cm&fs=1");
  url.searchParams.set("to", FEEDBACK_EMAIL);
  url.searchParams.set("su", "Cognitive Mode uninstall feedback");
  url.searchParams.set("body", body);
  return url.toString();
}

export default function GoodbyeFeedbackForm() {
  const [reason, setReason] = useState(REASONS[0].value);
  const [notes, setNotes] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.open(buildGmailComposeUrl(reason, notes), "_blank", "noopener,noreferrer");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-border/70 bg-[rgba(255,255,255,0.02)] p-6 backdrop-blur-sm"
    >
      <fieldset className="space-y-4">
        <legend className="font-mono text-sm font-semibold tracking-tight text-foreground">
          What was the main reason?
        </legend>

        <div className="grid gap-3 sm:grid-cols-2">
          {REASONS.map((item) => {
            const Icon = item.icon;

            return (
              <label
                key={item.value}
                className="flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-[rgba(24,24,27,0.72)] p-4 text-sm text-muted transition hover:border-foreground/50 hover:text-foreground"
              >
                <input
                  type="radio"
                  name="reason"
                  value={item.value}
                  checked={reason === item.value}
                  onChange={() => setReason(item.value)}
                  className="h-4 w-4 accent-emerald-300"
                />
                <Icon className="h-4 w-4 shrink-0 text-emerald-300/80" aria-hidden />
                <span>{item.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="block space-y-3">
        <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
          Anything else?
        </span>
        <textarea
          name="notes"
          rows={5}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="What got in your way?"
          className="w-full resize-y rounded-xl border border-border/70 bg-[rgba(9,9,11,0.8)] px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition placeholder:text-muted/55 focus:border-emerald-300/70"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted">
          Opens Gmail with your feedback prefilled. No analytics or tracking
          scripts are used on this page.
        </p>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-400/60 bg-[rgba(16,185,129,0.08)] px-6 text-sm font-medium text-foreground shadow-[0_0_24px_rgba(16,185,129,0.18)] transition hover:border-emerald-300 hover:bg-[rgba(16,185,129,0.15)]"
        >
          Send feedback
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </form>
  );
}
