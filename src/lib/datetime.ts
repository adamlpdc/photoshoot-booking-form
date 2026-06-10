import {
  BOOKING_TIMEZONE,
  CLOSE_HOUR,
  OPEN_HOUR,
  SLOT_MINUTES,
  WEEKDAY_INDICES,
} from "./constants";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

/** All calendar times are interpreted as GMT (UTC). */
export function getBookingTimezone(): string {
  return BOOKING_TIMEZONE;
}

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  let hour = get("hour");
  if (hour === 24) hour = 0;
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour,
    minute: get("minute"),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function zonedWeekday(date: Date): number {
  const w = new Intl.DateTimeFormat("en-US", {
    timeZone: getBookingTimezone(),
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[w] ?? 0;
}

/** Parse YYYY-MM-DD as noon GMT. */
export function parseLocalDate(dateStr: string): Date {
  return combineDateAndTime(dateStr, "12:00");
}

export function formatDateISO(date: Date): string {
  const z = zonedParts(date, getBookingTimezone());
  return `${z.year}-${pad2(z.month)}-${pad2(z.day)}`;
}

/** Monday noon GMT for the week containing `date`. */
export function getWeekStart(date: Date): Date {
  const z = zonedParts(date, getBookingTimezone());
  const noon = combineDateAndTime(
    `${z.year}-${pad2(z.month)}-${pad2(z.day)}`,
    "12:00"
  );
  const day = zonedWeekday(noon);
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(noon, diff);
}

/** Mon 00:00 GMT through next Mon 00:00 GMT (exclusive) for range queries. */
export function getWeekRangeBounds(anchor: Date): { start: Date; end: Date } {
  const monday = getWeekStart(anchor);
  const mondayIso = formatDateISO(monday);
  const start = combineDateAndTime(mondayIso, "00:00");
  const nextMondayIso = formatDateISO(addDays(monday, 7));
  const end = combineDateAndTime(nextMondayIso, "00:00");
  return { start, end };
}

export function addDays(date: Date, days: number): Date {
  const z = zonedParts(date, getBookingTimezone());
  const shifted = new Date(Date.UTC(z.year, z.month - 1, z.day + days));
  return combineDateAndTime(
    `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`,
    `${pad2(z.hour)}:${pad2(z.minute)}`
  );
}

export function getWeekDates(weekStart: Date): Date[] {
  return WEEKDAY_INDICES.map((offset) => addDays(weekStart, offset - 1));
}

export function isWeekdayBookable(date: Date): boolean {
  return WEEKDAY_INDICES.includes(zonedWeekday(date));
}

/** Wall date + time in GMT → instant for storage. */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const tz = getBookingTimezone();
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);

  let utcMs = Date.UTC(y, m - 1, d, hh, mm, 0);
  for (let i = 0; i < 6; i++) {
    const z = zonedParts(new Date(utcMs), tz);
    if (
      z.year === y &&
      z.month === m &&
      z.day === d &&
      z.hour === hh &&
      z.minute === mm
    ) {
      return new Date(utcMs);
    }
    const desired = Date.UTC(y, m - 1, d, hh, mm);
    const actual = Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute);
    utcMs += desired - actual;
  }
  return new Date(utcMs);
}

export function formatTimeLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: getBookingTimezone(),
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatTimeInput(date: Date): string {
  const z = zonedParts(date, getBookingTimezone());
  return `${pad2(z.hour)}:${pad2(z.minute)}`;
}

export function minutesFromMidnight(date: Date): number {
  const z = zonedParts(date, getBookingTimezone());
  return z.hour * 60 + z.minute;
}

export function isAlignedToSlot(date: Date): boolean {
  const z = zonedParts(date, getBookingTimezone());
  return z.minute % SLOT_MINUTES === 0;
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
      options.push(`${pad2(h)}:${pad2(m)}`);
    }
  }
  return options;
}

/** UK display: DD/MM/YY (GMT calendar date). */
export function formatDateUK(date: Date): string {
  const z = zonedParts(date, getBookingTimezone());
  const yy = String(z.year % 100).padStart(2, "0");
  return `${pad2(z.day)}/${pad2(z.month)}/${yy}`;
}

export function formatDateUKFromIso(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  return formatDateUK(parseLocalDate(isoDate));
}

/** Parse DD/MM/YY, DD/MM/YYYY, or YYYY-MM-DD → ISO date for the API. */
export function parseUKDateInput(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  let year = parseInt(match[3], 10);
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const iso = `${year}-${pad2(month)}-${pad2(day)}`;
  const z = zonedParts(parseLocalDate(iso), getBookingTimezone());
  if (z.year !== year || z.month !== month || z.day !== day) return null;
  return iso;
}

export function formatWeekdayShort(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: getBookingTimezone(),
    weekday: "short",
  })
    .format(date)
    .toUpperCase();
}

export function formatDateRangeUK(startIso: string, endIso: string): string {
  return `${formatDateUKFromIso(startIso)} – ${formatDateUKFromIso(endIso)}`;
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
