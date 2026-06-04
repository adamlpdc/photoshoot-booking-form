import { CLOSE_HOUR, OPEN_HOUR, SLOT_MINUTES } from "./constants";
import {
  combineDateAndTime,
  formatDateISO,
  getWeekDates,
  getWeekStart,
  parseLocalDate,
  timesOverlap,
} from "./datetime";
import { isDayBlockedByShootCap } from "./booking-rules";
import type {
  AvailabilityResponse,
  Booking,
  BlockedDay,
  DayAvailability,
  PublicBooking,
  SlotStatus,
} from "./types";
import { toPublicBooking } from "./supabase-server";

export function buildAvailability(
  weekStartStr: string,
  bookings: Booking[],
  blockedDays: BlockedDay[]
): AvailabilityResponse {
  const weekStart = getWeekStart(parseLocalDate(weekStartStr));
  const weekDates = getWeekDates(weekStart);
  const weekEnd = formatDateISO(weekDates[weekDates.length - 1]);

  const blockedSet = new Set(blockedDays.map((b) => b.date));
  const shootDays = new Set(
    bookings.map((b) => formatDateISO(new Date(b.start_time)))
  );
  const capReached = shootDays.size >= 2;

  const days: DayAvailability[] = weekDates.map((d) => {
    const date = formatDateISO(d);
    return {
      date,
      isBlocked: blockedSet.has(date),
      isShootDayCapReached: isDayBlockedByShootCap(
        date,
        bookings,
        weekStart
      ),
      isExistingShootDay: shootDays.has(date),
    };
  });

  return {
    weekStart: formatDateISO(weekStart),
    weekEnd,
    bookings: bookings.map(toPublicBooking) as PublicBooking[],
    blockedDays,
    days,
  };
}

export function getSlotStatus(
  slotStart: Date,
  slotEnd: Date,
  bookings: PublicBooking[],
  dayInfo: DayAvailability | undefined
): SlotStatus {
  if (dayInfo?.isBlocked) return "blocked";
  if (dayInfo?.isShootDayCapReached) return "unavailable";

  const booked = bookings.some((b) => {
    const bStart = new Date(b.start_time);
    const bEnd = new Date(b.end_time);
    return timesOverlap(slotStart, slotEnd, bStart, bEnd);
  });

  if (booked) return "booked";
  return "available";
}

export function buildWeekSlotGrid(weekStart: Date): { date: string; slots: Date[] }[] {
  const weekDates = getWeekDates(weekStart);
  const timeLabels: string[] = [];

  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      timeLabels.push(`${hh}:${mm}`);
    }
  }

  return weekDates.map((day) => {
    const date = formatDateISO(day);
    const daySlots = timeLabels.map((time) => combineDateAndTime(date, time));
    return { date, slots: daySlots };
  });
}

export function slotEndTime(slotStart: Date): Date {
  return new Date(slotStart.getTime() + SLOT_MINUTES * 60 * 1000);
}
