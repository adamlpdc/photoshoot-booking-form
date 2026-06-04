import type { DesignerId } from "./types";

export const DESIGNER_EVENT_STYLES: Record<
  DesignerId,
  { bg: string; accent: string; text: string; muted: string }
> = {
  Edi: {
    bg: "bg-sky-100",
    accent: "bg-sky-500",
    text: "text-sky-950",
    muted: "text-sky-800/80",
  },
  Sol: {
    bg: "bg-violet-100",
    accent: "bg-violet-500",
    text: "text-violet-950",
    muted: "text-violet-800/80",
  },
};

export function getDesignerStyles(designer: string) {
  if (designer === "Edi" || designer === "Sol") {
    return DESIGNER_EVENT_STYLES[designer];
  }
  return {
    bg: "bg-zinc-100",
    accent: "bg-zinc-400",
    text: "text-zinc-900",
    muted: "text-zinc-600",
  };
}
