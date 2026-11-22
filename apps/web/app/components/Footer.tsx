import Link from "next/link";
import Image from "next/image";
import { CHROME_WEB_STORE_URL, GITHUB_URL, PRODUCT_HUNT_URL } from "../links";

const LINK_CLASS = "font-mono text-[11px] text-muted/60 transition hover:text-foreground";

const EXTERNAL_LINKS = [
  { label: "Chrome Web Store", href: CHROME_WEB_STORE_URL },
  { label: "GitHub", href: GITHUB_URL },
  { label: "Product Hunt", href: PRODUCT_HUNT_URL },
];

export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-6 pb-12">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Left: brand + copyright */}
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-tight text-foreground">
            <Image
              src="/icon.svg"
              alt="Cognitive Mode logo"
              width={18}
              height={18}
              className="h-[18px] w-[18px] rounded-[5px]"
            />
            cognitivemode
          </span>
          <p className="font-mono text-[10px] text-muted/50">
            © {new Date().getFullYear()} · Practice with AI. Think for yourself.
          </p>
        </div>

        {/* Right: links */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-end">
          <Link href="/#demo" className={LINK_CLASS}>
            Try Demo
          </Link>
          {EXTERNAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              {link.label}
            </a>
          ))}
          <Link href="/privacy" className={LINK_CLASS}>
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
