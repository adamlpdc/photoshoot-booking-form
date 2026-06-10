"use client";

import { useState } from "react";
import {
  displayBrand,
  formatDateISO,
  formatDateUKFromIso,
  formatTimeLabel,
} from "@/lib/datetime";
import { bookingToFormInput } from "@/lib/booking-update";
import type { Booking } from "@/lib/types";
import {
  BookingFormFields,
  formValuesToInput,
  type BookingFormValues,
} from "./BookingFormFields";

function bookingToFormValues(booking: Booking): BookingFormValues {
  const input = bookingToFormInput(booking);
  return {
    brand: input.brand,
    customBrand: input.customBrand ?? "",
    title: input.title,
    designer: input.designer,
    attendees: input.attendees,
    description: input.description ?? "",
    requesterName: input.requesterName,
    requesterEmail: input.requesterEmail,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
  };
}

interface AdminBookingPanelProps {
  password: string;
  bookings: Booking[];
  onChanged: () => void;
}

export function AdminBookingPanel({
  password,
  bookings,
  onChanged,
}: AdminBookingPanelProps) {
  const [editing, setEditing] = useState<Booking | null>(null);
  const [values, setValues] = useState<BookingFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function startEdit(booking: Booking) {
    setEditing(booking);
    setValues(bookingToFormValues(booking));
    setError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setValues(null);
    setError(null);
  }

  async function saveEdit() {
    if (!editing || !values) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formValuesToInput(values),
          adminPassword: password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update booking.");
        return;
      }
      cancelEdit();
      onChanged();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteBooking(booking: Booking) {
    const label = displayBrand(booking.brand, booking.custom_brand);
    if (!confirm(`Delete booking "${label}" on ${booking.title}?`)) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not delete booking.");
        return;
      }
      if (editing?.id === booking.id) cancelEdit();
      onChanged();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  if (bookings.length === 0) {
    return (
      <p className="mt-2 text-sm text-ink-muted">No bookings this week.</p>
    );
  }

  return (
    <div className="mt-2">
      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="space-y-2">
        {bookings.map((b) => {
          const start = new Date(b.start_time);
          const end = new Date(b.end_time);
          const brand = displayBrand(b.brand, b.custom_brand);
          return (
            <li
              key={b.id}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{brand}</p>
                  <p className="text-ink-muted">{b.title}</p>
                  <p className="text-ink-muted">
                    {formatDateUKFromIso(formatDateISO(start))} ·{" "}
                    {formatTimeLabel(start)} – {formatTimeLabel(end)} ·{" "}
                    {b.designer}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {b.requester_name} · {b.requester_email}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => startEdit(b)}
                    className="text-ink-muted hover:text-ink"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => deleteBooking(b)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {editing && values && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
          <h3 className="font-semibold">Edit booking</h3>
          <p className="mt-1 text-xs text-ink-muted">
            Admin edits ignore the 24-hour cutoff.
          </p>
          <div className="mt-4">
            <BookingFormFields
              values={values}
              onChange={setValues}
              disabled={loading}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={saveEdit}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={cancelEdit}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
