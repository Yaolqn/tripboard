/**
 * Site URL resolution. Prefer NEXT_PUBLIC_SITE_URL (set in .env / Vercel
 * dashboard) so canonical links, Open Graph URLs and share links stay
 * consistent across environments. Never hardcode a domain in components.
 */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  // Vercel sets VERCEL_URL during builds and at runtime (e.g.
  // "tripboard-phi.vercel.app") — keeps canonical/OG on the real domain
  // even when NEXT_PUBLIC_SITE_URL isn't configured.
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

/** Absolute URL for a site path, e.g. siteUrlFor("/about"). */
export function siteUrlFor(path: string): string {
  const base = siteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
