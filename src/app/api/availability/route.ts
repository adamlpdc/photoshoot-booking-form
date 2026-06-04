import { NextRequest, NextResponse } from "next/server";
import { addDays, formatDateISO, getWeekStart, parseLocalDate } from "@/lib/datetime";
import { buildAvailability } from "@/lib/availability";
import {
  fetchBlockedDaysInRange,
  fetchBookingsForRange,
} from "@/lib/supabase-server";
import { handleApiError, jsonError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const weekStartParam = request.nextUrl.searchParams.get("weekStart");
    if (!weekStartParam) {
      return jsonError("weekStart query parameter is required (YYYY-MM-DD).");
    }

    const weekStart = getWeekStart(parseLocalDate(weekStartParam));
    const weekEnd = addDays(weekStart, 7);

    const [bookings, blockedDays] = await Promise.all([
      fetchBookingsForRange(weekStart, weekEnd),
      fetchBlockedDaysInRange(
        formatDateISO(weekStart),
        formatDateISO(addDays(weekStart, 6))
      ),
    ]);

    const availability = buildAvailability(
      formatDateISO(weekStart),
      bookings,
      blockedDays
    );

    return NextResponse.json(availability);
  } catch (err) {
    return handleApiError(err);
  }
}
