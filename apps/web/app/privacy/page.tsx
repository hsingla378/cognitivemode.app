import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Cognitive Mode",
  description:
    "Cognitive Mode operates 100% locally. No data is transmitted to external servers, sold, or tracked via third-party analytics.",
};

const SECTIONS = [
  {
    title: "Local-first by design",
    body: (
      <>
        <p>
          Cognitive Mode operates 100% locally. All data, including cognitive
          logs, hypotheses, and settings, are stored exclusively on your device
          using Chrome&apos;s local storage API. No data is transmitted to
          external servers, sold, or tracked via third-party analytics.
        </p>
        <p>
          The extension does not connect to any backend service operated by
          Cognitive Mode. There are no user accounts, no cloud sync, and no
          remote databases.
        </p>
      </>
    ),
  },
  {
    title: "What data is stored",
    body: (
      <>
        <p>
          The extension stores the following information locally in your
          browser via{" "}
          <code className="rounded bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
            chrome.storage.local
          </code>
          :
        </p>
        <ul className="list-inside list-disc space-y-1.5 pl-1">
          <li>Extension preferences and configuration settings</li>
          <li>Cognitive logs and session history you generate while using the extension</li>
          <li>Hypotheses and notes you enter before interacting with AI tools</li>
          <li>Per-site friction rules and delay settings</li>
        </ul>
        <p>
          This data remains on your device until you uninstall the extension or
          clear your browser&apos;s extension storage.
        </p>
      </>
    ),
  },
  {
    title: "What we do not collect",
    body: (
      <ul className="list-inside list-disc space-y-1.5 pl-1">
        <li>No personal information is sent to Cognitive Mode or any third party</li>
        <li>No usage analytics, telemetry, or crash reporting</li>
        <li>No advertising identifiers or tracking pixels</li>
        <li>No cookies or cross-site tracking of any kind</li>
        <li>No sale, rental, or sharing of user data</li>
      </ul>
    ),
  },
  {
    title: "Permissions",
    body: (
      <>
        <p>
          Cognitive Mode requests only the browser permissions required to
          function. These permissions are used locally on your device to
          intercept and add friction to AI tool interactions on supported sites.
          Permission access does not result in data being transmitted off your
          device.
        </p>
      </>
    ),
  },
  {
    title: "Third-party services",
    body: (
      <p>
        Cognitive Mode does not integrate with third-party analytics, advertising
        networks, or data brokers. The extension does not embed external scripts
        that phone home. Any network requests initiated by the extension are
        limited to the AI platforms you actively use and are subject to those
        platforms&apos; own privacy policies — Cognitive Mode does not proxy,
        log, or store the contents of those requests on external servers.
      </p>
    ),
  },
  {
    title: "Your control",
    body: (
      <ul className="list-inside list-disc space-y-1.5 pl-1">
        <li>
          You can review and delete stored data at any time through the
          extension&apos;s settings or by clearing extension storage in{" "}
          <code className="rounded bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
            chrome://extensions
          </code>
        </li>
        <li>
          Uninstalling the extension removes all locally stored Cognitive Mode
          data from your device
        </li>
        <li>
          Because no data leaves your device, there is no remote account or
          server-side data to request deletion of
        </li>
      </ul>
    ),
  },
  {
    title: "Changes to this policy",
    body: (
      <p>
        If this privacy policy is updated, the revised version will be posted
        at this URL. Material changes will be reflected in the &ldquo;Last
        updated&rdquo; date below. Continued use of the extension after changes
        constitutes acceptance of the updated policy.
      </p>
    ),
  },
  {
    title: "Contact",
    body: (
      <p>
        Questions about this privacy policy can be directed via the{" "}
        <a
          href="https://github.com/hsingla378/cognitivemode/issues"
          target="_blank"
          rel="noreferrer"
          className="text-emerald-300/80 underline-offset-4 transition hover:text-emerald-200 hover:underline"
        >
          GitHub issue tracker
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <article className="mx-auto w-full max-w-3xl flex-1 px-6 pt-32 pb-20">
        <div className="mb-10 space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted/70 transition hover:text-foreground"
          >
            ← Back to home
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-[rgba(24,24,27,0.85)] px-4 py-1 text-[11px] font-mono uppercase tracking-[0.22em] text-muted shadow-[0_0_0_1px_rgba(24,24,27,0.6)] backdrop-blur-md">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            privacy · local · zero telemetry
          </div>

          <div className="space-y-3">
            <h1 className="font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted">
              Last updated: June 23, 2026
            </p>
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            This policy describes how Cognitive Mode handles your data. In short:
            it doesn&apos;t leave your device.
          </p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-border/70 bg-[rgba(255,255,255,0.02)] p-6 backdrop-blur-sm"
            >
              <h2 className="mb-4 font-mono text-sm font-semibold tracking-tight text-foreground">
                {section.title}
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-muted">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-emerald-400/20 bg-[rgba(16,185,129,0.06)] p-6 shadow-[0_0_40px_rgba(52,211,153,0.05)]">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-300/70">
            Summary
          </p>
          <p className="mt-3 text-sm leading-relaxed text-emerald-100/90">
            Cognitive Mode operates 100% locally. All data, including cognitive
            logs, hypotheses, and settings, are stored exclusively on your device
            using Chrome&apos;s local storage API. No data is transmitted to
            external servers, sold, or tracked via third-party analytics.
          </p>
        </div>
      </article>

      <Footer />
    </main>
  );
}
