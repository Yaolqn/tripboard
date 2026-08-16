"use client";

import { useI18n } from "@/lib/i18n";
import { SimplePage } from "@/components/simple-page";

export default function PrivacyPage() {
  const { t } = useI18n();
  return <SimplePage title={t("privacyTitle")} body={t("privacyBody")} />;
}
