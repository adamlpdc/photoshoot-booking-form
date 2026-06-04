import { NextRequest, NextResponse } from "next/server";
import { addDays, formatDateISO, getWeekStart, parseLocalDate } from "@/lib/datetime";
import { sendBookingNotifications } from "@/lib/notifications";
import {
  fetchBlockedDaysInRange,
  fetchBookingsForRange,
  getSupabaseAdmin,
  toPublicBooking,
} from "@/lib/supabase-server";
import { generateEditToken, getEditLink } from "@/lib/tokens";
import type { BookingFormInput } from "@/lib/types";
import {
  validateNewBooking,
  BookingValidationError,
} from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api-utils";

function getWeekRange(weekStartStr: string) {
  const weekStart = getWeekStart(parseLocalDate(weekStartStr));
  const weekEnd = addDays(weekStart, 7);
  return { weekStart, weekEnd, weekStartStr: formatDateISO(weekStart) };
}

export async function GET(request: NextRequest) {
  try {
    const weekStartParam = request.nextUrl.searchParams.get("weekStart");
    if (!weekStartParam) {
      return jsonError("weekStart query parameter is required (YYYY-MM-DD).");
    }

    const { weekStart, weekEnd } = getWeekRange(weekStartParam);
    const bookings = await fetchBookingsForRange(weekStart, weekEnd);

    return NextResponse.json({
      weekStart: formatDateISO(weekStart),
      bookings: bookings.map(toPublicBooking),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingFormInput;

    const { weekStart, weekEnd } = getWeekRange(body.date);
    const [bookings, blockedDays] = await Promise.all([
      fetchBookingsForRange(weekStart, weekEnd),
      fetchBlockedDaysInRange(
        formatDateISO(weekStart),
        formatDateISO(addDays(weekStart, 6))
      ),
    ]);

    const blockedDates = new Set(blockedDays.map((b) => b.date));
    const { brand, custom_brand, start, end } = validateNewBooking(
      body,
      bookings,
      blockedDates
    );

    const edit_token = generateEditToken();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        brand,
        custom_brand,
        title: body.title.trim(),
        designer: body.designer,
        attendees: body.attendees.trim(),
        description: body.description?.trim() || null,
        requester_name: body.requesterName.trim(),
        requester_email: body.requesterEmail.trim(),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        edit_token,
      })
      .select("*")
      .single();

    if (error) throw error;

    const editLink = getEditLink(edit_token);

    await sendBookingNotifications({
      booking: data,
      editLink,
      isUpdate: false,
      isCancellation: false,
    });

    return NextResponse.json({
      booking: toPublicBooking(data),
      editLink,
      editToken: edit_token,
    });
  } catch (err) {
    if (err instanceof BookingValidationError) {
      return jsonError(err.message, 400);
    }
    return handleApiError(err);
  }
}
