import { toPng } from "html-to-image";

/**
 * PNG export for the itinerary. Renders a hidden, already-styled DOM node
 * (see ExportCanvas) at its exact CSS size — 1080px wide for both the
 * story card (1080×1920) and the long full-itinerary image.
 */
export async function exportNodeToPng(node: HTMLElement, fileName: string): Promise<void> {
  const dataUrl = await toPng(node, {
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: "#ffffff",
  });
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

export function exportFileName(base: string): string {
  const slug = base
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${slug || "trip"}-itinerary.png`;
}
