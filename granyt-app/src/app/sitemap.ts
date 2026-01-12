import { MetadataRoute } from "next";
import { env } from "@/env";

const BASE_URL = env.NEXT_PUBLIC_APP_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    // Landing page
    "",
    // Docs pages
    "docs",
    "docs/dashboard",
    "docs/metrics",
    "docs/error-tracking",
    "docs/notifications",
    "docs/webhooks",
    "docs/sdk-reference/environment-variables",
  ];

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}/${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
