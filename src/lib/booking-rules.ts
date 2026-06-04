import { MAX_SHOOT_DAYS_PER_WEEK } from "./constants";
import { formatDateISO, getWeekStart, parseLocalDate } from "./datetime";
import type { Booking } from "./types";

/**
 * Weekly shoot-day cap (shared across Edi and Sol)
 *
 * The studio allows at most TWO distinct calendar days with shoots per week
 * (Monday–Thursday window). Once two different days already have bookings,
 * any other Mon–Thu day in that same week is unavailable — even if those two
 * days still have open time slots.
 *
 * Additional bookings on a day that is already one of the week's two shoot
 * days are allowed (same day, non-overlapping times still subject to the
 * global one-booking-at-a-time rule).
 */
export function getShootDaysInWeek(
  bookings: Pick<Booking, "start_time">[],
  weekStartDate: Date
): Set<string> {
  const weekStart = getWeekStart(weekStartDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const days = new Set<string>();
  for (const b of bookings) {
    const start = new Date(b.start_time);
    if (start >= weekStart && start < weekEnd) {
      days.add(formatDateISO(start));
    }
  }
  return days;
}

export function wouldExceedShootDayCap(
  existingBookings: Pick<Booking, "start_time" | "id">[],
  targetDate: string,
  excludeBookingId?: string
): boolean {
  const filtered = excludeBookingId
    ? existingBookings.filter((b) => b.id !== excludeBookingId)
    : existingBookings;

  const weekStart = getWeekStart(parseLocalDate(targetDate));
  const shootDays = getShootDaysInWeek(filtered, weekStart);

  if (shootDays.has(targetDate)) {
    return false;
  }

  return shootDays.size >= MAX_SHOOT_DAYS_PER_WEEK;
}

export function isDayBlockedByShootCap(
  dateStr: string,
  bookings: Pick<Booking, "start_time">[],
  weekStart: Date
): boolean {
  const shootDays = getShootDaysInWeek(bookings, weekStart);
  if (shootDays.size < MAX_SHOOT_DAYS_PER_WEEK) return false;
  return !shootDays.has(dateStr);
}
