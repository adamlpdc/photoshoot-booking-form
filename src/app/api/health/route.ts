import { NextResponse } from "next/server";
import { getResendHealthCheck } from "@/lib/notifications";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/**
 * GET /api/health — verify Supabase env vars and database tables.
 * Safe to call locally after setup (does not expose secrets).
 */
export async function GET() {
  const checks: Record<string, string> = {};

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    checks.supabaseUrl = "missing NEXT_PUBLIC_SUPABASE_URL";
  } else {
    checks.supabaseUrl = "ok";
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    checks.serviceRoleKey = "missing SUPABASE_SERVICE_ROLE_KEY";
  } else {
    checks.serviceRoleKey = "ok";
  }

  if (!process.env.ADMIN_PASSWORD) {
    checks.adminPassword = "missing ADMIN_PASSWORD";
  } else {
    checks.adminPassword = "ok";
  }

  checks.resend = getResendHealthCheck();

  const envOk =
    checks.supabaseUrl === "ok" &&
    checks.serviceRoleKey === "ok" &&
    checks.adminPassword === "ok";

  if (!envOk) {
    return NextResponse.json(
      {
        ok: false,
        message: "Fix .env.local — see checks below.",
        checks,
      },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    const bookings = await supabase.from("bookings").select("id").limit(1);
    if (bookings.error) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Connected to Supabase but the bookings table is missing or inaccessible. Run supabase/schema.sql in the SQL Editor.",
          checks: { ...checks, bookingsTable: bookings.error.message },
        },
        { status: 503 }
      );
    }

    const blocked = await supabase.from("blocked_days").select("id").limit(1);
    if (blocked.error) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "bookings table OK, but blocked_days failed. Run supabase/schema.sql in the SQL Editor.",
          checks: { ...checks, blockedDaysTable: blocked.error.message },
        },
        { status: 503 }
      );
    }

    const emailNote =
      checks.resend === "ok"
        ? " Resend is configured for booking emails."
        : " Resend not configured — bookings work but emails are not sent.";

    return NextResponse.json({
      ok: true,
      message: `Supabase is linked and tables are ready.${emailNote}`,
      checks: {
        ...checks,
        bookingsTable: "ok",
        blockedDaysTable: "ok",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, message, checks },
      { status: 503 }
    );
  }
}
