import { CLOSE_HOUR, OPEN_HOUR, SLOT_MINUTES, WEEKDAY_INDICES } from "./constants";

/** Parse YYYY-MM-DD as local calendar date (noon avoids DST edge cases). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Monday of the week containing `date` (local time). */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getWeekDates(weekStart: Date): Date[] {
  return WEEKDAY_INDICES.map((offset) => addDays(weekStart, offset - 1));
}

export function isWeekdayBookable(date: Date): boolean {
  return WEEKDAY_INDICES.includes(date.getDay());
}

export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTimeInput(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function minutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function isAlignedToSlot(date: Date): boolean {
  const mins = date.getMinutes();
  return mins % SLOT_MINUTES === 0 && date.getSeconds() === 0;
}

export function isWithinBusinessHours(start: Date, end: Date): boolean {
  const open = OPEN_HOUR * 60;
  const close = CLOSE_HOUR * 60;
  const s = minutesFromMidnight(start);
  const e = minutesFromMidnight(end);
  return s >= open && e <= close && s < e;
}

export function timesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = OPEN_HOUR; h <= CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      if (h === CLOSE_HOUR && m > 0) break;
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
}

export function displayBrand(brand: string, customBrand: string | null): string {
  if (brand === "Other" && customBrand) return customBrand;
  return brand;
}

export function hoursUntilStart(start: Date): number {
  return (start.getTime() - Date.now()) / (1000 * 60 * 60);
}

export function canModifyBooking(start: Date): boolean {
  return hoursUntilStart(start) > 24;
}
