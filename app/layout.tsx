import type { Metadata } from "next";
import type { User } from "@supabase/supabase-js";
import "@fontsource-variable/inter";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import { LanguageProvider } from "@/lib/i18n";
import { getServerUser } from "@/lib/supabase/server";
import { SessionProvider } from "@/components/auth/session-provider";
import { Toaster } from "@/components/ui/sonner";

const TITLE = "TripBoard — Plan your trip. Make it beautiful.";
const DESCRIPTION =
  "Create beautiful travel itineraries, organize your days, track your budget, and share your trip with anyone.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: TITLE,
    template: "%s · TripBoard",
  },
  description: DESCRIPTION,
  keywords: [
    "travel itinerary",
    "trip planner",
    "itinerary",
    "travel planning",
    "trip budget",
    "itinerary template",
  ],
  robots: { index: true, follow: true },
  alternates: {
    canonical: siteUrl(),
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl(),
    siteName: "TripBoard",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user: User | null = await getServerUser();
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <LanguageProvider>
          <SessionProvider initialUser={user}>{children}</SessionProvider>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
