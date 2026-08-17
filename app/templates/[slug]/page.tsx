import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTemplate } from "@/lib/templates";
import { siteUrl } from "@/lib/site";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { TemplateDetail } from "@/components/templates/template-detail";
import { Wordmark } from "@/components/trip/wordmark";

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) notFound();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/">
          <Wordmark />
        </Link>
        <LanguageToggle />
      </header>
      <TemplateDetail template={template} />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) return {};
  const title = `${template.title} | TripBoard`;
  return {
    title,
    description: template.description,
    alternates: { canonical: siteUrl() + `/templates/${template.slug}` },
    openGraph: {
      title,
      description: template.description,
      url: siteUrl() + `/templates/${template.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
  };
}
