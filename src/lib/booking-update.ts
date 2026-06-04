import type { BookingFormInput } from "./types";
import type { Booking } from "./types";

export function bookingToFormInput(booking: Booking): BookingFormInput & {
  date: string;
  startTime: string;
  endTime: string;
} {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const d = String(start.getDate()).padStart(2, "0");
  const hh = (n: number) => String(n).padStart(2, "0");

  return {
    brand: booking.brand as BookingFormInput["brand"],
    customBrand: booking.custom_brand ?? undefined,
    title: booking.title,
    designer: booking.designer as BookingFormInput["designer"],
    attendees: booking.attendees,
    description: booking.description ?? undefined,
    requesterName: booking.requester_name,
    requesterEmail: booking.requester_email,
    date: `${y}-${m}-${d}`,
    startTime: `${hh(start.getHours())}:${hh(start.getMinutes())}`,
    endTime: `${hh(end.getHours())}:${hh(end.getMinutes())}`,
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
