import { NextResponse } from "next/server";
import { fetchBookingByToken } from "@/lib/supabase-server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { canModifyBooking } from "@/lib/datetime";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const booking = await fetchBookingByToken(token);

    if (!booking) {
      return jsonError("Booking not found.", 404);
    }

    return NextResponse.json({
      booking,
      canModify: canModifyBooking(new Date(booking.start_time)),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
