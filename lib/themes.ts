import type { ThemeId } from "@/types/trip";

export interface ThemeConfig {
  id: ThemeId;
  /** classes applied to the public trip page shell */
  shell: string;
  /** heading classes */
  heading: string;
  /** subtle label classes */
  label: string;
  /** monospace flag for time column */
  monoTime: boolean;
}

export const THEME_CONFIGS: Record<ThemeId, ThemeConfig> = {
  minimal: {
    id: "minimal",
    shell: "",
    heading: "font-semibold tracking-tight",
    label: "font-semibold uppercase tracking-[0.18em]",
    monoTime: false,
  },
  classic: {
    id: "classic",
    shell: "",
    heading: "font-serif font-medium tracking-tight",
    label: "font-serif font-semibold uppercase tracking-[0.18em]",
    monoTime: false,
  },
  mono: {
    id: "mono",
    shell: "",
    heading: "font-mono font-semibold tracking-tight",
    label: "font-mono font-semibold uppercase tracking-[0.18em]",
    monoTime: true,
  },
  // Premium placeholders — locked in V0.3 (no payments yet).
  japan: {
    id: "japan",
    shell: "bg-[#faf6f0]",
    heading: "font-semibold tracking-tight",
    label: "font-semibold uppercase tracking-[0.18em]",
    monoTime: false,
  },
  pastel: {
    id: "pastel",
    shell: "bg-[#fdf6f4]",
    heading: "font-semibold tracking-tight",
    label: "font-semibold uppercase tracking-[0.18em]",
    monoTime: false,
  },
  retro: {
    id: "retro",
    shell: "bg-[#faf5e6]",
    heading: "font-serif font-medium tracking-tight",
    label: "font-serif font-semibold uppercase tracking-[0.18em]",
    monoTime: false,
  },
  luxury: {
    id: "luxury",
    shell: "bg-[#fbf9f4]",
    heading: "font-serif font-medium tracking-tight",
    label: "font-serif font-semibold uppercase tracking-[0.18em]",
    monoTime: false,
  },
};

export function isProTheme(id: ThemeId): boolean {
  return ["japan", "pastel", "retro", "luxury"].includes(id);
}

/** Cover presets (V0.3: no uploads, preset gradient headers). */
export const COVER_CONFIGS: Record<string, { from: string; to: string }> = {
  tokyo: { from: "#fdf1e7", to: "#f7dfd0" },
  seoul: { from: "#eef1f8", to: "#dde3f2" },
  paris: { from: "#f4ecf4", to: "#e8d9ea" },
  singapore: { from: "#e9f4ee", to: "#d3e8dc" },
  taipei: { from: "#fdf3e3", to: "#f6e2c2" },
};

export function coverColors(cover?: string): { from: string; to: string } {
  return (cover && COVER_CONFIGS[cover]) || { from: "#f3f3f3", to: "#e7e7e7" };
}
