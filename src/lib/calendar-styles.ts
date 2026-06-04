import type { DesignerId } from "./types";

export type DesignerEventStyle = {
  fill: string;
  accent: string;
  textClass: string;
  mutedClass: string;
};

/** Solid fills for booking blocks (inline styles — always visible in dev). */
export const DESIGNER_EVENT_STYLES: Record<DesignerId, DesignerEventStyle> = {
  Edi: {
    fill: "#93c5fd",
    accent: "#2563eb",
    textClass: "text-blue-950",
    mutedClass: "text-blue-900",
  },
  Sol: {
    fill: "#fda4af",
    accent: "#e11d48",
    textClass: "text-rose-950",
    mutedClass: "text-rose-900",
  },
};

const DEFAULT_BOOKING_STYLE = DESIGNER_EVENT_STYLES.Edi;

export function getDesignerStyles(designer: string): DesignerEventStyle {
  const key = designer.trim();
  if (key === "Edi") return DESIGNER_EVENT_STYLES.Edi;
  if (key === "Sol") return DESIGNER_EVENT_STYLES.Sol;
  return DEFAULT_BOOKING_STYLE;
}
