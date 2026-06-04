"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  formatDateISO,
  formatTimeInput,
  getWeekStart,
  parseLocalDate,
} from "@/lib/datetime";
import { OPEN_HOUR, CLOSE_HOUR, SLOT_MINUTES } from "@/lib/constants";
import {
  buildWeekSlotGrid,
  getSlotStatus,
  slotEndTime,
} from "@/lib/availability";
import type { AvailabilityResponse, SlotStatus } from "@/lib/types";
import { BookingCard } from "./BookingCard";
import { CalendarLegend } from "./CalendarLegend";
import { BookingModal } from "./BookingModal";
import { ConfirmationPanel } from "./ConfirmationPanel";
import type { BookingFormValues } from "./BookingFormFields";
const SLOT_COUNT =
  ((CLOSE_HOUR - OPEN_HOUR) * 60) / SLOT_MINUTES;
const ROW_HEIGHT = 20;

const slotStatusClass: Record<SlotStatus, string> = {
  available:
    "bg-slot-available hover:bg-emerald-100 border-emerald-100 cursor-pointer",
  booked: "bg-slot-booked border-blue-100 cursor-default",
  blocked: "bg-slot-blocked border-amber-100 cursor-not-allowed",
  unavailable:
    "bg-slot-unavailable border-zinc-100 cursor-not-allowed opacity-70",
};

function defaultFormValues(
  date: string,
  startTime: string,
  endTime: string
): BookingFormValues {
  return {
    brand: "Dr Teals",
    customBrand: "",
    title: "",
    designer: "Edi",
    attendees: "",
    description: "",
    requesterName: "",
    requesterEmail: "",
    date,
    startTime,
    endTime,
  };
}

function bookingPosition(
  start: Date,
  end: Date,
  dayStart: Date
): { top: number; height: number } | null {
  const dayOpen = new Date(dayStart);
  dayOpen.setHours(OPEN_HOUR, 0, 0, 0);
  const startMin =
    (start.getTime() - dayOpen.getTime()) / (SLOT_MINUTES * 60 * 1000);
  const endMin =
    (end.getTime() - dayOpen.getTime()) / (SLOT_MINUTES * 60 * 1000);
  if (endMin <= 0 || startMin >= SLOT_COUNT) return null;
  const top = Math.max(0, startMin) * ROW_HEIGHT;
  const height = (Math.min(SLOT_COUNT, endMin) - Math.max(0, startMin)) * ROW_HEIGHT;
  return { top, height };
}

export function WeeklyCalendar() {
  const [weekStart, setWeekStart] = useState(() =>
    formatDateISO(getWeekStart(new Date()))
  );
  const [availability, setAvailability] =
    useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<BookingFormValues>(
    defaultFormValues(weekStart, "09:00", "09:30")
  );
  const [confirmLink, setConfirmLink] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/availability?weekStart=${encodeURIComponent(weekStart)}`
      );
      const data = await res.json();
      if (res.ok) {
        setAvailability(data);
        return;
      }
      setAvailability(null);
      setLoadError(
        data.error ||
          "Could not load the calendar. Check server environment variables on Vercel."
      );
    } catch {
      setAvailability(null);
      setLoadError("Network error loading the calendar. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const weekStartDate = useMemo(
    () => getWeekStart(parseLocalDate(weekStart)),
    [weekStart]
  );

  const grid = useMemo(
    () => buildWeekSlotGrid(weekStartDate),
    [weekStartDate]
  );

  const dayMap = useMemo(() => {
    const m = new Map(
      availability?.days.map((d) => [d.date, d]) ?? []
    );
    return m;
  }, [availability]);

  function shiftWeek(delta: number) {
    const next = addDays(parseLocalDate(weekStart), delta * 7);
    setWeekStart(formatDateISO(getWeekStart(next)));
  }

  function handleSlotClick(date: string, slotStart: Date) {
    const dayInfo = dayMap.get(date);
    const status = getSlotStatus(
      slotStart,
      slotEndTime(slotStart),
      availability?.bookings ?? [],
      dayInfo
    );
    if (status !== "available") return;

    const end = slotEndTime(slotStart);
    setFormInitial(
      defaultFormValues(
        date,
        formatTimeInput(slotStart),
        formatTimeInput(end)
      )
    );
    setModalOpen(true);
  }

  const weekLabel = availability
    ? `${availability.weekStart} — ${availability.weekEnd}`
    : weekStart;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Monday–Thursday · 9:00 AM–5:00 PM · 15-minute slots
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-white"
          >
            ← Previous week
          </button>
          <span className="min-w-[10rem] text-center text-sm font-medium">
            {weekLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-white"
          >
            Next week →
          </button>
        </div>
      </div>

      <CalendarLegend />

      <p className="mt-3 text-xs text-ink-muted">
        Max two shoot days per week (shared across designers). Only one shoot at
        a time studio-wide.
      </p>

      {loading && (
        <p className="mt-8 text-sm text-ink-muted">Loading calendar…</p>
      )}

      {!loading && loadError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Calendar could not load</p>
          <p className="mt-1">{loadError}</p>
          <p className="mt-3 text-red-700">
            On Vercel, add{" "}
            <code className="rounded bg-red-100 px-1">
              NEXT_PUBLIC_SUPABASE_URL
            </code>
            ,{" "}
            <code className="rounded bg-red-100 px-1">
              SUPABASE_SERVICE_ROLE_KEY
            </code>
            , and{" "}
            <code className="rounded bg-red-100 px-1">ADMIN_PASSWORD</code> in
            Project Settings → Environment Variables, then redeploy. Check{" "}
            <a href="/api/health" className="underline">
              /api/health
            </a>
            .
          </p>
        </div>
      )}

      {!loading && availability && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[4rem_repeat(4,1fr)] border-b border-zinc-200">
              <div />
              {grid.map(({ date }) => {
                const d = parseLocalDate(date);
                const label = d.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const dayInfo = dayMap.get(date);
                return (
                  <div
                    key={date}
                    className="border-l border-zinc-100 px-2 py-3 text-center text-sm font-medium"
                  >
                    {label}
                    {dayInfo?.isBlocked && (
                      <span className="mt-1 block text-xs font-normal text-amber-700">
                        Blocked
                      </span>
                    )}
                    {dayInfo?.isShootDayCapReached && (
                      <span className="mt-1 block text-xs font-normal text-zinc-500">
                        Week cap
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-[4rem_repeat(4,1fr)]">
              <div className="relative">
                {grid[0].slots.map((slot, i) => {
                  if (slot.getMinutes() % 30 !== 0) return null;
                  return (
                    <div
                      key={i}
                      className="border-b border-zinc-50 pr-2 text-right text-[10px] text-ink-muted"
                      style={{ height: ROW_HEIGHT * 2 }}
                    >
                      {slot.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  );
                })}
              </div>

              {grid.map(({ date, slots }) => {
                const dayInfo = dayMap.get(date);
                const dayBookings =
                  availability.bookings.filter(
                    (b) =>
                      formatDateISO(new Date(b.start_time)) === date
                  );

                return (
                  <div
                    key={date}
                    className="relative border-l border-zinc-100"
                    style={{ height: SLOT_COUNT * ROW_HEIGHT }}
                  >
                    {slots.map((slotStart, i) => {
                      const slotEnd = slotEndTime(slotStart);
                      const status = getSlotStatus(
                        slotStart,
                        slotEnd,
                        availability.bookings,
                        dayInfo
                      );
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={status !== "available"}
                          onClick={() => handleSlotClick(date, slotStart)}
                          className={`absolute left-0 right-0 border-b border-white/50 ${slotStatusClass[status]}`}
                          style={{
                            top: i * ROW_HEIGHT,
                            height: ROW_HEIGHT,
                          }}
                          aria-label={`${date} ${formatTimeInput(slotStart)} ${status}`}
                        />
                      );
                    })}

                    {dayBookings.map((booking) => {
                      const start = new Date(booking.start_time);
                      const end = new Date(booking.end_time);
                      const pos = bookingPosition(
                        start,
                        end,
                        parseLocalDate(date)
                      );
                      if (!pos) return null;
                      return (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          style={{
                            top: pos.top,
                            height: pos.height,
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <BookingModal
        open={modalOpen}
        initialValues={formInitial}
        onClose={() => setModalOpen(false)}
        onSuccess={({ editLink }) => {
          setModalOpen(false);
          setConfirmLink(editLink);
          load();
        }}
      />

      {confirmLink && (
        <ConfirmationPanel
          editLink={confirmLink}
          onDone={() => {
            setConfirmLink(null);
            load();
          }}
        />
      )}
    </div>
  );
}
