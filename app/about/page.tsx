"use client";

import { useI18n } from "@/lib/i18n";
import { SimplePage } from "@/components/simple-page";

export default function AboutPage() {
  const { t } = useI18n();
  return <SimplePage title={t("aboutTitle")} body={t("aboutBody")} />;
}
