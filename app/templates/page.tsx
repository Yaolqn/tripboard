"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, LayoutTemplate, MapPin } from "lucide-react";
import { TEMPLATES } from "@/lib/templates";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { HeaderAuth, CreateTripButton } from "@/components/auth/header-auth";
import { Wordmark } from "@/components/trip/wordmark";

export default function TemplatesPage() {
  const { t, dayCount } = useI18n();

  const groups = useMemo(() => {
    const map = new Map<string, typeof TEMPLATES>();
    for (const template of TEMPLATES) {
      const key = template.destination;
      const list = map.get(key) ?? [];
      list.push(template);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <Link href="/">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <HeaderAuth />
          <CreateTripButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">{t("templates")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("templatesSub")}</p>

        <div className="mt-10 space-y-10">
          {groups.map(([destination, list]) => (
            <section key={destination}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="size-4" />
                {destination}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((template) => (
                  <Link
                    key={template.slug}
                    href={`/templates/${template.slug}`}
                    className="group flex flex-col rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      <LayoutTemplate className="size-4" />
                    </div>
                    <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
                      {template.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                      {template.description}
                    </p>
                    <p className="mt-3 text-xs tabular-nums text-muted-foreground/80">
                      {dayCount(template.days.length)}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      {t("viewTrip")}
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
