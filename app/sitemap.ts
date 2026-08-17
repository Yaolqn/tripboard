import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { serverGetPublicTrips } from "@/lib/data/server";

/**
 * Sitemap — only public trips are listed. Private/unlisted trips never
 * appear here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = siteUrl();
  const entries: MetadataRoute.Sitemap = [
    { url, changeFrequency: "weekly", priority: 1 },
    { url: `${url}/explore`, changeFrequency: "daily", priority: 0.8 },
    { url: `${url}/templates`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${url}/about`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const trips = await serverGetPublicTrips(100);
  for (const trip of trips) {
    if (!trip.slug) continue;
    entries.push({
      url: `${url}/trip/${trip.slug}`,
      lastModified: new Date(trip.updatedAt),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
