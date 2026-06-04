import { formatDateISO, formatTimeInput } from "./datetime";
import type { BookingFormInput } from "./types";
import type { Booking } from "./types";

export function bookingToFormInput(booking: Booking): BookingFormInput & {
  date: string;
  startTime: string;
  endTime: string;
} {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  return {
    brand: booking.brand as BookingFormInput["brand"],
    customBrand: booking.custom_brand ?? undefined,
    title: booking.title,
    designer: booking.designer as BookingFormInput["designer"],
    attendees: booking.attendees,
    description: booking.description ?? undefined,
    requesterName: booking.requester_name,
    requesterEmail: booking.requester_email,
    date: formatDateISO(start),
    startTime: formatTimeInput(start),
    endTime: formatTimeInput(end),
  };
}

export function buildBookingUpdateRow(
  body: BookingFormInput,
  fields: {
    brand: string;
    custom_brand: string | null;
    start: Date;
    end: Date;
  }
) {
  return {
    brand: fields.brand,
    custom_brand: fields.custom_brand,
    title: body.title.trim(),
    designer: body.designer,
    attendees: body.attendees.trim(),
    description: body.description?.trim() || null,
    requester_name: body.requesterName.trim(),
    requester_email: body.requesterEmail.trim(),
    start_time: fields.start.toISOString(),
    end_time: fields.end.toISOString(),
  };
}
