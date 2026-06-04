import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Booking, BlockedDay } from "./types";

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}

export async function fetchBookingsForRange(
  rangeStart: Date,
  rangeEnd: Date
): Promise<Booking[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .lt("start_time", rangeEnd.toISOString())
    .gt("end_time", rangeStart.toISOString())
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function fetchBlockedDaysInRange(
  startDate: string,
  endDate: string
): Promise<BlockedDay[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("blocked_days")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as BlockedDay[];
}

export async function fetchBookingById(id: string): Promise<Booking | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Booking | null;
}

export async function fetchBookingByToken(
  token: string
): Promise<Booking | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("edit_token", token)
    .maybeSingle();

  if (error) throw error;
  return data as Booking | null;
}

export function toPublicBooking(b: Booking) {
  return {
    id: b.id,
    brand: b.brand,
    custom_brand: b.custom_brand,
    designer: b.designer,
    start_time: b.start_time,
    end_time: b.end_time,
  };
}
