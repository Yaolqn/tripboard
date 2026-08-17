import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Robots.txt — private/dashboard routes are blocked from indexing. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/my-trips",
          "/settings",
          "/login",
          "/signup",
          "/auth/",
          "/share/",
          "/invite/",
          "/trips",
        ],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
