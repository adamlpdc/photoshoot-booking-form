"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addDays,
  formatDateISO,
  getWeekStart,
  parseLocalDate,
} from "@/lib/datetime";
import type { AvailabilityResponse, Booking } from "@/lib/types";
import { AdminBookingPanel } from "@/components/AdminBookingPanel";

export default function AdminPage() {
  const [weekStart, setWeekStart] = useState(() =>
    formatDateISO(getWeekStart(new Date()))
  );
  const [availability, setAvailability] =
    useState<AvailabilityResponse | null>(null);
  const [adminBookings, setAdminBookings] = useState<Booking[]>([]);
  const [password, setPassword] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingsUnlocked, setBookingsUnlocked] = useState(false);

  const loadAvailability = useCallback(async () => {
    const res = await fetch(
      `/api/availability?weekStart=${encodeURIComponent(weekStart)}`
    );
    const data = await res.json();
    if (res.ok) setAvailability(data);
  }, [weekStart]);

  const loadBookings = useCallback(async () => {
    if (!password) {
      setError("Enter the admin password.");
      return false;
    }
    const res = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, weekStart }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAdminBookings([]);
      setBookingsUnlocked(false);
      setError(data.error || "Could not load bookings. Check your password.");
      return false;
    }
    setAdminBookings(data.bookings ?? []);
    setBookingsUnlocked(true);
    setError(null);
    return true;
  }, [password, weekStart]);

  const load = useCallback(async () => {
    await loadAvailability();
    if (bookingsUnlocked) {
      await loadBookings();
    }
  }, [loadAvailability, loadBookings, bookingsUnlocked]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    await loadBookings();
    setLoading(false);
  }

  function shiftWeek(delta: number) {
    const next = addDays(parseLocalDate(weekStart), delta * 7);
    setWeekStart(formatDateISO(getWeekStart(next)));
  }

  useEffect(() => {
    if (bookingsUnlocked) {
      loadBookings();
    }
  }, [weekStart, bookingsUnlocked, loadBookings]);

  async function blockDay() {
    if (!selectedDate || !password) {
      setError("Select a date and enter the admin password.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/block-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          password,
          reason: reason || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not block day.");
        return;
      }
      setMessage(`Blocked ${selectedDate}.`);
      setReason("");
      await load();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function unblockDay(date: string) {
    if (!password) {
      setError("Enter the admin password.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/block-day", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not unblock day.");
        return;
      }
      setMessage(`Unblocked ${date}.`);
      await load();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const weekDays = availability?.days ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Block days, edit bookings, or delete bookings. Requires admin password.
      </p>

      <form className="mt-6" onSubmit={submitPassword}>
        <label className="text-sm font-medium" htmlFor="admin-password">
          Admin password
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="admin-password"
            type="password"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setBookingsUnlocked(false);
              setAdminBookings([]);
            }}
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load week"}
          </button>
        </div>
      </form>

      <div className="mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => shiftWeek(-1)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          ← Previous
        </button>
        <span className="text-sm font-medium">
          {availability?.weekStart} — {availability?.weekEnd}
        </span>
        <button
          type="button"
          onClick={() => shiftWeek(1)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          Next →
        </button>
      </div>

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

      {bookingsUnlocked && (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold">
            Bookings this week ({adminBookings.length})
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            Edit or delete any booking below.
          </p>
          <AdminBookingPanel
            password={password}
            bookings={adminBookings}
            onChanged={load}
          />
        </div>
      )}

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Block a day</h2>
        <div className="mt-3 grid gap-3">
          <select
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            <option value="">Select date…</option>
            {weekDays.map((d) => (
              <option key={d.date} value={d.date}>
                {d.date}
                {d.isBlocked ? " (already blocked)" : ""}
                {d.isShootDayCapReached ? " (2-day limit)" : ""}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            type="button"
            disabled={loading}
            onClick={blockDay}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Block day
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold">Blocked days this week</h2>
        {availability?.blockedDays.length === 0 && (
          <p className="mt-2 text-sm text-ink-muted">None</p>
        )}
        <ul className="mt-2 space-y-2">
          {availability?.blockedDays.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <span>
                {b.date}
                {b.reason ? ` — ${b.reason}` : ""}
              </span>
              <button
                type="button"
                disabled={loading}
                onClick={() => unblockDay(b.date)}
                className="text-ink-muted hover:text-red-700"
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
