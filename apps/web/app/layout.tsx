import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cognitivemode.app"),
  title: "Cognitive Mode | Reclaim Your Problem-Solving Brain",
  description:
    "A local-first browser extension designed to introduce intentional friction into your AI workflows. Stop mindless copy-pasting; force your brain to articulate hypotheses before offloading code to LLMs.",
  keywords: [
    "browser extension",
    "developer productivity",
    "cognitive friction",
    "local-first tool",
    "AI dependency",
    "software engineering habits",
  ],
  openGraph: {
    title: "Cognitive Mode | Reclaim Your Problem-Solving Brain",
    description:
      "A local-first browser extension designed to introduce intentional friction into your AI workflows. Stop mindless copy-pasting; force your brain to articulate hypotheses before offloading code to LLMs.",
    url: "https://cognitivemode.app",
    siteName: "Cognitive Mode",
    type: "website",
    images: [
      {
        url: "https://cognitivemode.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cognitive Mode preview image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cognitive Mode | Reclaim Your Problem-Solving Brain",
    description:
      "A local-first browser extension designed to introduce intentional friction into your AI workflows. Stop mindless copy-pasting; force your brain to articulate hypotheses before offloading code to LLMs.",
    images: ["https://cognitivemode.app/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
