"use client";

import { useI18n } from "@/lib/i18n";
import { SimplePage } from "@/components/simple-page";

export default function TermsPage() {
  const { t } = useI18n();
  return <SimplePage title={t("termsTitle")} body={t("termsBody")} />;
}
