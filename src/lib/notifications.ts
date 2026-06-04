import { DESIGNERS } from "./constants";
import { displayBrand, formatTimeLabel } from "./datetime";
import type { Booking } from "./types";

export interface BookingNotificationPayload {
  booking: Booking;
  editLink: string;
  isUpdate: boolean;
  isCancellation: boolean;
}

/**
 * Stub for Office 365 / Microsoft Graph calendar + email invites.
 * Replace the body with Graph API calls (create event, send mail) when ready.
 */
export async function sendBookingNotifications(
  payload: BookingNotificationPayload
): Promise<void> {
  const { booking, editLink, isUpdate, isCancellation } = payload;
  const designer = DESIGNERS.find((d) => d.id === booking.designer);
  const brandLabel = displayBrand(booking.brand, booking.custom_brand);
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);

  const inviteDetails = {
    action: isCancellation
      ? "cancel"
      : isUpdate
        ? "update"
        : "create",
    subject: isCancellation
      ? `Cancelled: ${booking.title} — ${brandLabel}`
      : `${booking.title} — ${brandLabel} photoshoot`,
    startISO: booking.start_time,
    endISO: booking.end_time,
    timeRange: `${formatTimeLabel(start)} – ${formatTimeLabel(end)}`,
    designer: booking.designer,
    designerEmail: designer?.email,
    requesterName: booking.requester_name,
    requesterEmail: booking.requester_email,
    attendees: booking.attendees,
    description: booking.description,
    editLink,
    recipientEmails: [
      booking.requester_email,
      designer?.email,
    ].filter(Boolean),
  };

  // TODO: Microsoft Graph — calendar event + email
  console.log("[sendBookingNotifications] Office 365 stub:", inviteDetails);
}
