import { NextRequest, NextResponse } from "next/server";
import {
  addDays,
  formatDateISO,
  getWeekStart,
  parseLocalDate,
} from "@/lib/datetime";
import { sendBookingNotifications } from "@/lib/notifications";
import { buildBookingUpdateRow } from "@/lib/booking-update";
import {
  fetchBlockedDaysInRange,
  fetchBookingById,
  fetchBookingsForRange,
  getSupabaseAdmin,
  toPublicBooking,
} from "@/lib/supabase-server";
import { getEditLink } from "@/lib/tokens";
import type { BookingFormInput } from "@/lib/types";
import {
  assertCanCancel,
  validateAdminBookingUpdate,
  validateBookingUpdate,
  verifyAdminPassword,
  BookingValidationError,
} from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api-utils";

async function loadWeekContext(date: string) {
  const weekStart = getWeekStart(parseLocalDate(date));
  const weekEnd = addDays(weekStart, 7);
  const [bookings, blockedDays] = await Promise.all([
    fetchBookingsForRange(weekStart, weekEnd),
    fetchBlockedDaysInRange(
      formatDateISO(weekStart),
      formatDateISO(addDays(weekStart, 6))
    ),
  ]);
  return {
    bookings,
    blockedDates: new Set(blockedDays.map((b) => b.date)),
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as BookingFormInput & {
      editToken?: string;
      adminPassword?: string;
    };

    const existing = await fetchBookingById(id);
    if (!existing) {
      return jsonError("Booking not found.", 404);
    }

    const isAdmin =
      !!body.adminPassword &&
      (() => {
        try {
          verifyAdminPassword(body.adminPassword!);
          return true;
        } catch (e) {
          if (e instanceof BookingValidationError) return false;
          throw e;
        }
      })();

    if (!isAdmin) {
      if (!body.editToken || existing.edit_token !== body.editToken) {
        return jsonError("Booking not found or invalid edit token.", 404);
      }
    }

    const { bookings, blockedDates } = await loadWeekContext(body.date);
    const validated = isAdmin
      ? validateAdminBookingUpdate(body, bookings, blockedDates, id)
      : validateBookingUpdate(
          body,
          bookings,
          blockedDates,
          id,
          new Date(existing.start_time)
        );

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("bookings")
      .update(buildBookingUpdateRow(body, validated))
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    const editLink = getEditLink(data.edit_token);
    await sendBookingNotifications({
      booking: data,
      editLink,
      isUpdate: true,
      isCancellation: false,
    });

    return NextResponse.json({
      booking: isAdmin ? data : toPublicBooking(data),
      editLink,
    });
  } catch (err) {
    if (err instanceof BookingValidationError) {
      return jsonError(err.message, 400);
    }
    return handleApiError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      editToken?: string;
      adminPassword?: string;
    };

    const existing = await fetchBookingById(id);
    if (!existing) {
      return jsonError("Booking not found.", 404);
    }

    const isAdmin =
      !!body.adminPassword &&
      (() => {
        try {
          verifyAdminPassword(body.adminPassword!);
          return true;
        } catch (e) {
          if (e instanceof BookingValidationError) return false;
          throw e;
        }
      })();

    if (!isAdmin) {
      if (!body.editToken || existing.edit_token !== body.editToken) {
        return jsonError("Booking not found or invalid edit token.", 404);
      }
      assertCanCancel(new Date(existing.start_time));
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) throw error;

    await sendBookingNotifications({
      booking: existing,
      editLink: getEditLink(existing.edit_token),
      isUpdate: false,
      isCancellation: true,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof BookingValidationError) {
      return jsonError(err.message, 400);
    }
    return handleApiError(err);
  }
}
