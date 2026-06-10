import { NextRequest, NextResponse } from "next/server";
import {
  formatDateISO,
  getWeekDates,
  getWeekRangeBounds,
  getWeekStart,
  parseLocalDate,
} from "@/lib/datetime";
import { fetchBookingsForRange } from "@/lib/supabase-server";
import {
  verifyAdminPassword,
  BookingValidationError,
  AdminConfigError,
} from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      password: string;
      weekStart: string;
    };

    if (!body.password || !body.weekStart) {
      return jsonError("Password and weekStart are required.");
    }

    verifyAdminPassword(body.password);

    const anchor = getWeekStart(parseLocalDate(body.weekStart));
    const { start, end } = getWeekRangeBounds(anchor);
    const allInRange = await fetchBookingsForRange(start, end);
    const weekDateSet = new Set(
      getWeekDates(anchor).map((d) => formatDateISO(d))
    );
    const bookings = allInRange.filter((b) =>
      weekDateSet.has(formatDateISO(new Date(b.start_time)))
    );

    return NextResponse.json({
      weekStart: formatDateISO(anchor),
      bookings,
    });
  } catch (err) {
    if (err instanceof AdminConfigError) {
      return jsonError(err.message, 503);
    }
    if (err instanceof BookingValidationError) {
      return jsonError(err.message, 403);
    }
    return handleApiError(err);
  }
}
