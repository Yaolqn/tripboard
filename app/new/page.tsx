"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CURRENCIES } from "@/types/trip";
import { createTrip } from "@/lib/storage";
import { useI18n } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageToggle } from "@/components/ui/language-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormErrors {
  startDate?: string;
  endDate?: string;
}

export default function NewTripPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState(t("defaultTripName"));
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currency, setCurrency] = useState("JPY");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Keep the default name in sync when the UI language changes, but only
  // while the user hasn't typed their own name yet.
  const defaultName = t("defaultTripName");
  useEffect(() => {
    setName((prev) =>
      prev === "My Trip" || prev === "我的旅行" ? defaultName : prev
    );
  }, [defaultName]);

  const handleStartChange = (value: string) => {
    setStartDate(value);
    if (value && (!endDate || endDate < value)) setEndDate(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: FormErrors = {};
    if (!startDate) nextErrors.startDate = t("errStartRequired");
    if (!endDate) {
      nextErrors.endDate = t("errEndRequired");
    } else if (startDate && endDate < startDate) {
      nextErrors.endDate = t("errEndBeforeStart");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const trip = createTrip({ name, destination, currency, startDate, endDate });
      track("trip_created", { source: "new_page" });
      router.push(`/trip/${trip.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
        <LanguageToggle />
      </div>

      <h1 className="mt-10 text-2xl font-semibold tracking-tight">
        {t("createYourTrip")}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{t("daysAuto")}</p>

      <form onSubmit={handleSubmit} className="mt-9 space-y-6" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="tb-name">{t("tripName")}</Label>
          <Input
            id="tb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("defaultTripName")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tb-destination">{t("destination")}</Label>
          <Input
            id="tb-destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={t("phDestination")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="tb-start">{t("startDate")}</Label>
            <Input
              id="tb-start"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => handleStartChange(e.target.value)}
              className={cn(errors.startDate && "border-destructive focus-visible:ring-destructive/50")}
            />
            {errors.startDate && (
              <p className="text-xs text-destructive">{errors.startDate}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tb-end">{t("endDate")}</Label>
            <Input
              id="tb-end"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className={cn(errors.endDate && "border-destructive focus-visible:ring-destructive/50")}
            />
            {errors.endDate && (
              <p className="text-xs text-destructive">{errors.endDate}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("currency")}</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? t("creating") : t("createTripBtn")}
        </Button>
      </form>
    </div>
  );
}
