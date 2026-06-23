import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../components/Footer";
import GoodbyeFeedbackForm from "./GoodbyeFeedbackForm";

export const metadata: Metadata = {
  title: "Goodbye | Cognitive Mode",
  description:
    "Tell us why Cognitive Mode did not fit so we can make the extension better.",
};

export default function GoodbyePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pt-28 pb-20">
        <div className="mb-10 space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted/70 transition hover:text-foreground"
          >
            Back to home
          </Link>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-[rgba(24,24,27,0.85)] px-4 py-1 text-[11px] font-mono uppercase tracking-[0.22em] text-muted shadow-[0_0_0_1px_rgba(24,24,27,0.6)] backdrop-blur-md">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.8)]" />
            uninstall feedback
          </div>

          <div className="space-y-4">
            <h1 className="font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Thanks for trying Cognitive Mode.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              If you have ten seconds, tell us what made you remove it. A blunt
              answer is perfect.
            </p>
          </div>
        </div>

        <GoodbyeFeedbackForm />
      </section>

      <Footer />
    </main>
  );
}
