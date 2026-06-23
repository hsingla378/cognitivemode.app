import type { MetadataRoute } from "next";

const SITE_URL = "https://cognitivemode.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return ["", "/welcome", "/privacy", "/goodbye"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
