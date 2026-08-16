"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Download, ExternalLink, Link2 } from "lucide-react";
import type { Trip } from "@/types/trip";
import {
  buildShareUrl,
  canShareAsLink,
  sharePayloadLength,
} from "@/lib/share";
import { copyText } from "@/lib/clipboard";
import { track } from "@/lib/analytics";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ShareDialog({
  open,
  onOpenChange,
  trip,
  onExport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
  /** When provided, shows an "Export as PNG" escape hatch for oversized trips. */
  onExport?: () => void;
}) {
  const { t } = useI18n();
  const url = useMemo(() => buildShareUrl(trip), [trip]);
  const shareable = canShareAsLink(trip);
  const payloadLen = sharePayloadLength(trip);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      track("trip_shared", { source: "share_dialog" });
      toast.success(t("linkCopied"));
      setTimeout(() => setCopied(false), 1600);
    } else {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent sheetOnMobile className="sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>{t("shareYourTrip")}</DialogTitle>
          <DialogDescription>{t("shareDesc")}</DialogDescription>
        </DialogHeader>

        {shareable ? (
          <>
            <div className="rounded-lg border bg-muted/40 px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
              <span className="line-clamp-3 break-all">{url}</span>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={copy}>
                {copied ? <Check /> : <Link2 />}
                {copied ? t("copied") : t("copyLink")}
              </Button>
              <Button variant="outline" onClick={() => window.open(url, "_blank")}>
                <ExternalLink />
                {t("preview")}
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-800">
                  {t("shareTooLarge")}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-amber-700">
                  {t("shareTooLargeHint")}
                </p>
                {payloadLen > 0 && (
                  <p className="mt-1 text-xs text-amber-600/80">
                    {Math.round(payloadLen / 1024)} KB
                  </p>
                )}
              </div>
            </div>
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => {
                  onOpenChange(false);
                  onExport();
                }}
              >
                <Download />
                {t("export")}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
