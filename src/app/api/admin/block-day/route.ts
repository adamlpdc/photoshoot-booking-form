import { NextRequest, NextResponse } from "next/server";
import { formatDateISO, isWeekdayBookable, parseLocalDate } from "@/lib/datetime";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  BookingValidationError,
  verifyAdminPassword,
} from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      date: string;
      password: string;
      reason?: string;
      blockedBy?: string;
    };

    if (!body.date || !body.password) {
      return jsonError("Date and admin password are required.");
    }

    verifyAdminPassword(body.password);

    const day = parseLocalDate(body.date);
    if (!isWeekdayBookable(day)) {
      return jsonError(
        "Only Monday through Thursday can be blocked in this calendar."
      );
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blocked_days")
      .upsert(
        {
          date: formatDateISO(day),
          reason: body.reason?.trim() || null,
          blocked_by: body.blockedBy?.trim() || "admin",
        },
        { onConflict: "date" }
      )
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ blockedDay: data });
  } catch (err) {
    if (err instanceof BookingValidationError) {
      return jsonError(err.message, 403);
    }
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      date: string;
      password: string;
    };

    if (!body.date || !body.password) {
      return jsonError("Date and admin password are required.");
    }

    verifyAdminPassword(body.password);

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("blocked_days")
      .delete()
      .eq("date", body.date);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof BookingValidationError) {
      return jsonError(err.message, 403);
    }
    return handleApiError(err);
  }
}
