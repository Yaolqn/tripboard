"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { TravelTemplate } from "@/lib/templates";
import { TYPE_META } from "@/lib/trip-utils";
import { createTrip } from "@/lib/data";
import { addDays, todayISO } from "@/lib/format";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/components/auth/session-provider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TemplateDetail({ template }: { template: TravelTemplate }) {
  const { t, dayCount, dayLabel } = useI18n();
  const { user } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleUseTemplate = async () => {
    if (!isSupabaseConfigured() || !user) {
      toast(t("signInToUseTemplate"));
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const start = todayISO();
      const trip = await createTrip({
        name: template.title,
        destination: template.destination,
        currency: template.currency,
        startDate: start,
        endDate: addDays(start, template.days.length - 1),
        fromTemplate: {
          name: template.title,
          destination: template.destination,
          currency: template.currency,
          startDate: start,
          endDate: addDays(start, template.days.length - 1),
          days: template.days.map((d, i) => ({
            date: addDays(start, i),
            activities: d.activities.map((a) => ({
              id: "",
              type: a.type,
              title: a.title,
              time: a.time,
              location: a.location,
              cost: a.cost,
              createdAt: Date.now(),
            })),
          })),
          theme: template.theme,
          cover: template.cover,
        },
      });
      track("template_used", { template: template.slug });
      toast.success(t("templateUsed"));
      router.push(`/trip/${trip.id}`);
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8">
      {template.destination && (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {template.destination}
        </p>
      )}
      <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        {template.title}
      </h1>
      <p className="mt-4 text-base text-muted-foreground">{template.description}</p>
      <p className="mt-3 text-sm text-muted-foreground">
        {dayCount(template.days.length)}
      </p>

      <Button className="mt-8 w-full sm:w-auto" size="lg" onClick={() => void handleUseTemplate()} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {t("useThisTemplate")}
      </Button>

      <div className="mt-12">
        {template.days.map((day, i) => (
          <section key={i}>
            <div className="flex items-baseline gap-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                {dayLabel(i + 1)}
              </span>
              <span className="text-sm text-muted-foreground">{day.title}</span>
            </div>
            <div className="mt-2 mb-7 h-px bg-border" />
            {day.activities.map((a, j) => {
              const meta = TYPE_META[a.type];
              return (
                <div key={j} className="flex gap-5 py-2.5">
                  <div className="w-14 shrink-0 pt-[5px] text-right text-sm tabular-nums text-muted-foreground">
                    {a.time || ""}
                  </div>
                  <div className="relative w-px shrink-0 self-stretch bg-border/80">
                    <span
                      className={cn(
                        "absolute left-1/2 top-[8px] size-[7px] -translate-x-1/2 rounded-full",
                        meta.dot
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    <div className="flex items-center gap-2">
                      <meta.icon className={cn("size-4 shrink-0", meta.accent)} />
                      <span className="truncate text-[15px] font-medium">{a.title}</span>
                    </div>
                    {a.location && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{a.location}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
