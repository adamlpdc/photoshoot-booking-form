import type { BrandOption, DesignerId } from "./types";

export const APP_TITLE = "Photoshoot Booking Form";

export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 17;
export const SLOT_MINUTES = 60;

export const WEEKDAY_INDICES = [1, 2, 3, 4]; // Monday–Thursday

export const BRANDS: BrandOption[] = [
  "Dr Teals",
  "Elegant Touch",
  "Eylure",
  "Cantu",
  "Other",
];

export const DESIGNERS: {
  id: DesignerId;
  name: DesignerId;
  email: string;
}[] = [
  { id: "Edi", name: "Edi", email: "ehidalgo@pdcwellness.com" },
  { id: "Sol", name: "Sol", email: "HYoo@pdcwellness.com" },
];

export const MAX_SHOOT_DAYS_PER_WEEK = 2;
