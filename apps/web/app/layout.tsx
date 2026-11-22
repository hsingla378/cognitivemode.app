import type { Metadata } from "next";
import "./globals.css";

const TITLE = "Cognitive Mode | Practice DSA with AI hints, not answers";
const DESCRIPTION =
  "A free Chrome extension for LeetCode, GeeksforGeeks and takeUforward practice. When you ask ChatGPT, Claude or Gemini for help, choose a nudge, the approach, an outline or the full solution, then re-solve what you needed help on. No API key, nothing leaves your browser.";

export const metadata: Metadata = {
  metadataBase: new URL("https://cognitivemode.app"),
  applicationName: "Cognitive Mode",
  authors: [{ name: "Himanshu Singla", url: "https://github.com/hsingla378" }],
  creator: "Himanshu Singla",
  publisher: "Cognitive Mode",
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "LeetCode hints",
    "DSA practice",
    "coding interview prep",
    "ChatGPT for LeetCode",
    "Striver A2Z sheet",
    "GeeksforGeeks practice",
    "spaced repetition",
    "browser extension",
  ],
  category: "education",
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
  // og:image comes from app/opengraph-image.tsx.
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://cognitivemode.app",
    siteName: "Cognitive Mode",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Cognitive Mode",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Chrome",
  url: "https://cognitivemode.app",
  image: "https://cognitivemode.app/icon-128.png",
  description:
    "A free, local-only Chrome extension that turns ChatGPT, Claude and Gemini into a hint ladder while you practice LeetCode, GeeksforGeeks and takeUforward problems, and schedules re-solves for problems you needed help on.",
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
