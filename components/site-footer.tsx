"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Wordmark } from "@/components/trip/wordmark";

/** Shared site footer (landing + simple pages). */
export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t no-print">
      <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t("product")}
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/new"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("createTrip")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/my-trips"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("myTrips")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/explore"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("exploreTrips")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/templates"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("templates")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t("legal")}
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("about")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("privacy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("terms")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between border-t pt-6 text-[13px] text-muted-foreground">
          <span>TripBoard</span>
          <span>© {new Date().getFullYear()} TripBoard</span>
        </div>
      </div>
    </footer>
  );
}
