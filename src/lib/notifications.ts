import { Resend } from "resend";
import { APP_TITLE, DESIGNERS } from "./constants";
import {
  displayBrand,
  formatDateISO,
  formatDateUKFromIso,
  formatTimeLabel,
} from "./datetime";
import type { Booking } from "./types";

export interface BookingNotificationPayload {
  booking: Booking;
  editLink: string;
  isUpdate: boolean;
  isCancellation: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getResendConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

function buildEmailContent(payload: BookingNotificationPayload): {
  subject: string;
  html: string;
  text: string;
  to: string[];
} {
  const { booking, editLink, isUpdate, isCancellation } = payload;
  const designer = DESIGNERS.find((d) => d.id === booking.designer);
  const brandLabel = displayBrand(booking.brand, booking.custom_brand);
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const dateLabel = formatDateUKFromIso(formatDateISO(start));
  const timeRange = `${formatTimeLabel(start)} – ${formatTimeLabel(end)} GMT`;

  const subject = isCancellation
    ? `Cancelled: ${booking.title} — ${brandLabel}`
    : isUpdate
      ? `Updated: ${booking.title} — ${brandLabel}`
      : `Confirmed: ${booking.title} — ${brandLabel}`;

  const intro = isCancellation
    ? "This photoshoot booking has been cancelled."
    : isUpdate
      ? "This photoshoot booking has been updated."
      : "Your photoshoot booking is confirmed.";

  const lines = [
    intro,
    "",
    `Title: ${booking.title}`,
    `Brand: ${brandLabel}`,
    `Date: ${dateLabel}`,
    `Time: ${timeRange}`,
    `Designer: ${booking.designer}`,
    `Attendees: ${booking.attendees}`,
    `Booked by: ${booking.requester_name} (${booking.requester_email})`,
  ];

  if (booking.description?.trim()) {
    lines.push(`Description: ${booking.description.trim()}`);
  }

  if (!isCancellation) {
    lines.push("", `Manage this booking: ${editLink}`);
  }

  const text = lines.join("\n");

  const detailRows = [
    ["Title", booking.title],
    ["Brand", brandLabel],
    ["Date", dateLabel],
    ["Time", `${timeRange}`],
    ["Designer", booking.designer],
    ["Attendees", booking.attendees],
    ["Booked by", `${booking.requester_name} (${booking.requester_email})`],
  ];

  if (booking.description?.trim()) {
    detailRows.push(["Description", booking.description.trim()]);
  }

  const rowsHtml = detailRows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#71717a;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const actionHtml = isCancellation
    ? ""
    : `<p style="margin:24px 0 0"><a href="${escapeHtml(editLink)}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px">View or edit booking</a></p>`;

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#18181b;line-height:1.5;margin:0;padding:24px"><p>${escapeHtml(intro)}</p><table style="border-collapse:collapse;font-size:14px">${rowsHtml}</table>${actionHtml}<p style="margin-top:32px;font-size:12px;color:#71717a">${escapeHtml(APP_TITLE)}</p></body></html>`;

  const to = [booking.requester_email];
  if (designer?.email && designer.email !== booking.requester_email) {
    to.push(designer.email);
  }

  return { subject, html, text, to };
}

/**
 * Sends booking confirmation, update, and cancellation emails via Resend.
 * Skips silently when RESEND_API_KEY or RESEND_FROM_EMAIL are not set.
 */
export async function sendBookingNotifications(
  payload: BookingNotificationPayload
): Promise<void> {
  const config = getResendConfig();
  if (!config) {
    console.warn(
      "[sendBookingNotifications] Skipped — set RESEND_API_KEY and RESEND_FROM_EMAIL to send emails."
    );
    return;
  }

  const { subject, html, text, to } = buildEmailContent(payload);
  const replyTo = process.env.RESEND_REPLY_TO?.trim();

  const resend = new Resend(config.apiKey);
  const { data, error } = await resend.emails.send({
    from: config.from,
    to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    console.error("[sendBookingNotifications] Resend error:", error);
    return;
  }

  console.log("[sendBookingNotifications] Sent:", data?.id, "to", to.join(", "));
}

/** For /api/health — whether Resend is configured (emails optional). */
export function getResendHealthCheck(): string {
  const config = getResendConfig();
  if (!config) return "missing RESEND_API_KEY or RESEND_FROM_EMAIL";
  return "ok";
}
