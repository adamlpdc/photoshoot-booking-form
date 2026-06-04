import { BRANDS, DESIGNERS } from "./constants";
import {
  canModifyBooking,
  combineDateAndTime,
  isAlignedToSlot,
  isWeekdayBookable,
  isWithinBusinessHours,
  parseLocalDate,
} from "./datetime";
import { wouldExceedShootDayCap } from "./booking-rules";
import type { Booking, BookingFormInput } from "./types";

export class BookingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingValidationError";
  }
}

function assertBrand(input: BookingFormInput): {
  brand: string;
  custom_brand: string | null;
} {
  if (!BRANDS.includes(input.brand)) {
    throw new BookingValidationError("Please select a valid brand.");
  }
  if (input.brand === "Other") {
    const custom = input.customBrand?.trim();
    if (!custom) {
      throw new BookingValidationError(
        "Custom brand name is required when brand is Other."
      );
    }
    return { brand: input.brand, custom_brand: custom };
  }
  return { brand: input.brand, custom_brand: null };
}

function assertDesigner(designer: string): void {
  if (!DESIGNERS.some((d) => d.id === designer)) {
    throw new BookingValidationError("Please select Edi or Sol as the designer.");
  }
}

export function validateBookingTimes(
  date: string,
  startTime: string,
  endTime: string
): { start: Date; end: Date } {
  const day = parseLocalDate(date);
  if (!isWeekdayBookable(day)) {
    throw new BookingValidationError(
      "Bookings are only available Monday through Thursday."
    );
  }

  const start = combineDateAndTime(date, startTime);
  const end = combineDateAndTime(date, endTime);

  if (!isAlignedToSlot(start) || !isAlignedToSlot(end)) {
    throw new BookingValidationError(
      "Start and end times must use 15-minute increments."
    );
  }

  if (end <= start) {
    throw new BookingValidationError("End time must be after start time.");
  }

  if (!isWithinBusinessHours(start, end)) {
    throw new BookingValidationError(
      "Bookings must be between 9:00 AM and 5:00 PM."
    );
  }

  return { start, end };
}

export function validateNewBooking(
  input: BookingFormInput,
  existingBookings: Booking[],
  blockedDates: Set<string>
): {
  brand: string;
  custom_brand: string | null;
  start: Date;
  end: Date;
} {
  const brandFields = assertBrand(input);
  assertDesigner(input.designer);

  if (!input.title?.trim()) {
    throw new BookingValidationError("Shoot title is required.");
  }
  if (!input.attendees?.trim()) {
    throw new BookingValidationError("Who is going to be there is required.");
  }
  if (!input.requesterName?.trim()) {
    throw new BookingValidationError("Your name is required.");
  }
  if (!input.requesterEmail?.trim()) {
    throw new BookingValidationError("Your email is required.");
  }

  const { start, end } = validateBookingTimes(
    input.date,
    input.startTime,
    input.endTime
  );

  if (blockedDates.has(input.date)) {
    throw new BookingValidationError(
      "This day is blocked by an administrator and cannot be booked."
    );
  }

  if (
    wouldExceedShootDayCap(
      existingBookings,
      input.date,
      undefined
    )
  ) {
    throw new BookingValidationError(
      "This week already has two shoot days scheduled. Only those two days can accept more bookings."
    );
  }

  const overlap = existingBookings.some((b) => {
    const bStart = new Date(b.start_time);
    const bEnd = new Date(b.end_time);
    return start < bEnd && end > bStart;
  });

  if (overlap) {
    throw new BookingValidationError(
      "Another photoshoot is already scheduled during this time. Only one shoot can run at a time."
    );
  }

  return { ...brandFields, start, end };
}

function validateBookingMutation(
  input: BookingFormInput,
  existingBookings: Booking[],
  blockedDates: Set<string>,
  bookingId?: string
): {
  brand: string;
  custom_brand: string | null;
  start: Date;
  end: Date;
} {
  const brandFields = assertBrand(input);
  assertDesigner(input.designer);

  if (!input.title?.trim()) {
    throw new BookingValidationError("Shoot title is required.");
  }
  if (!input.attendees?.trim()) {
    throw new BookingValidationError("Who is going to be there is required.");
  }
  if (!input.requesterName?.trim()) {
    throw new BookingValidationError("Your name is required.");
  }
  if (!input.requesterEmail?.trim()) {
    throw new BookingValidationError("Your email is required.");
  }

  const { start, end } = validateBookingTimes(
    input.date,
    input.startTime,
    input.endTime
  );

  if (blockedDates.has(input.date)) {
    throw new BookingValidationError(
      "This day is blocked by an administrator and cannot be booked."
    );
  }

  if (wouldExceedShootDayCap(existingBookings, input.date, bookingId)) {
    throw new BookingValidationError(
      "This week already has two shoot days scheduled. Only those two days can accept more bookings."
    );
  }

  const overlap = existingBookings.some((b) => {
    if (bookingId && b.id === bookingId) return false;
    const bStart = new Date(b.start_time);
    const bEnd = new Date(b.end_time);
    return start < bEnd && end > bStart;
  });

  if (overlap) {
    throw new BookingValidationError(
      "Another photoshoot is already scheduled during this time. Only one shoot can run at a time."
    );
  }

  return { ...brandFields, start, end };
}

export function validateBookingUpdate(
  input: BookingFormInput,
  existingBookings: Booking[],
  blockedDates: Set<string>,
  bookingId: string,
  currentStart: Date
): {
  brand: string;
  custom_brand: string | null;
  start: Date;
  end: Date;
} {
  if (!canModifyBooking(currentStart)) {
    throw new BookingValidationError(
      "Bookings can only be edited or cancelled more than 24 hours before the start time."
    );
  }
  return validateBookingMutation(
    input,
    existingBookings,
    blockedDates,
    bookingId
  );
}

export function validateAdminBookingUpdate(
  input: BookingFormInput,
  existingBookings: Booking[],
  blockedDates: Set<string>,
  bookingId: string
) {
  return validateBookingMutation(
    input,
    existingBookings,
    blockedDates,
    bookingId
  );
}

export function assertCanCancel(start: Date): void {
  if (!canModifyBooking(start)) {
    throw new BookingValidationError(
      "Bookings can only be cancelled more than 24 hours before the start time."
    );
  }
}

export function verifyAdminPassword(password: string): void {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD is not configured on the server.");
  }
  if (password !== expected) {
    throw new BookingValidationError("Incorrect admin password.");
  }
}
