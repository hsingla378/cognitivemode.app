export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-6 pb-12">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Left: brand + copyright */}
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="font-mono text-xs font-semibold tracking-tight text-foreground">
            cognitivemode
          </span>
          <p className="font-mono text-[10px] text-muted/50">
            © {new Date().getFullYear()} · Think before you prompt.
          </p>
        </div>

        {/* Right: links */}
        <div className="flex items-center gap-5">
          <a
            href="https://github.com/hsingla378/cognitivemode"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] text-muted/60 transition hover:text-foreground"
          >
            GitHub
          </a>
          <span className="h-3 w-px bg-[--color-border]" />
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] text-muted/60 transition hover:text-foreground"
          >
            X / Twitter
          </a>
          <span className="h-3 w-px bg-[--color-border]" />
          <a
            href="#"
            className="font-mono text-[11px] text-muted/60 transition hover:text-foreground"
          >
            Add to Chrome
          </a>
        </div>
      </div>
    </footer>
  );
}
