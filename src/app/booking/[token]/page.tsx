"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BookingFormFields,
  formValuesToInput,
  type BookingFormValues,
} from "@/components/BookingFormFields";
import { displayBrand, formatDateISO, formatTimeInput } from "@/lib/datetime";
import type { Booking } from "@/lib/types";

function bookingToFormValues(booking: Booking): BookingFormValues {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  return {
    brand: booking.brand as BookingFormValues["brand"],
    customBrand: booking.custom_brand ?? "",
    title: booking.title,
    designer: booking.designer as BookingFormValues["designer"],
    attendees: booking.attendees,
    description: booking.description ?? "",
    requesterName: booking.requester_name,
    requesterEmail: booking.requester_email,
    date: formatDateISO(start),
    startTime: formatTimeInput(start),
    endTime: formatTimeInput(end),
  };
}

export default function EditBookingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [canModify, setCanModify] = useState(false);
  const [values, setValues] = useState<BookingFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/booking-by-token/${token}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Booking not found.");
        return;
      }
      setBooking(data.booking);
      setCanModify(data.canModify);
      setValues(bookingToFormValues(data.booking));
    } catch {
      setError("Could not load booking.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!booking || !values) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formValuesToInput(values),
          editToken: token,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update booking.");
        return;
      }
      setMessage("Booking updated successfully.");
      await load();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!booking) return;
    if (
      !confirm(
        "Cancel this photoshoot? This cannot be undone from the calendar."
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editToken: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not cancel booking.");
        return;
      }
      router.push("/?cancelled=1");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading your booking…</p>;
  }

  if (error && !booking) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!booking || !values) return null;

  const brandLabel = displayBrand(booking.brand, booking.custom_brand);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Manage your booking</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {brandLabel} · {booking.designer}
      </p>

      {!canModify && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This booking starts within 24 hours and can no longer be edited or
          cancelled online.
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}

      <form onSubmit={handleSave} className="mt-6">
        <BookingFormFields
          values={values}
          onChange={setValues}
          disabled={!canModify || saving}
        />

        {canModify && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleCancel}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Cancel booking
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
