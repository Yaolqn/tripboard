"use client";

import { Plus, Sunrise } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function EmptyDay({ onAdd }: { onAdd: () => void }) {
  const { t } = useI18n();
  return (
    <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-secondary">
        <Sunrise className="size-5 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-medium">{t("dayWideOpen")}</p>
      <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
        {t("dayWideOpenSub")}
      </p>
      <Button className="mt-5" size="sm" onClick={onAdd}>
        <Plus />
        {t("addActivity")}
      </Button>
    </div>
  );
}
