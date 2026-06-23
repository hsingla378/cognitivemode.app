import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cognitivemode.app"),
  applicationName: "Cognitive Mode",
  authors: [{ name: "Himanshu Singla", url: "https://github.com/hsingla378" }],
  creator: "Himanshu Singla",
  publisher: "Cognitive Mode",
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
  category: "technology",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-128.png", sizes: "128x128", type: "image/png" },
    ],
    apple: [{ url: "/icon-128.png", sizes: "128x128" }],
  },
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
        alt: "Cognitive Mode browser extension preview",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Cognitive Mode",
  applicationCategory: "BrowserApplication",
  operatingSystem: "Chrome",
  url: "https://cognitivemode.app",
  image: "https://cognitivemode.app/icon-128.png",
  description:
    "A local-first Chrome extension that adds intentional friction before AI prompts so developers articulate hypotheses first.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
