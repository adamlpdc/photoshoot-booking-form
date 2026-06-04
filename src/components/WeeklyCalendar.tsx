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

const SLOT_COUNT = ((CLOSE_HOUR - OPEN_HOUR) * 60) / SLOT_MINUTES;
const ROW_HEIGHT = 24;

function slotRowClass(status: SlotStatus, slotIndex: number): string {
  const isHourLine = slotIndex % 4 === 0;
  const border = isHourLine
    ? "border-b border-calendar-line"
    : "border-b border-calendar-lineSubtle";

  const base = `absolute left-0 right-0 ${border}`;

  switch (status) {
    case "available":
      return `${base} cursor-pointer bg-transparent hover:bg-zinc-300/60 active:bg-zinc-400/40`;
    case "booked":
      return `${base} cursor-default bg-transparent pointer-events-none`;
    case "blocked":
      return `${base} cursor-not-allowed bg-amber-50/80`;
    case "unavailable":
      return `${base} cursor-not-allowed bg-zinc-200/80`;
  }
}

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
  const height =
    (Math.min(SLOT_COUNT, endMin) - Math.max(0, startMin)) * ROW_HEIGHT;
  return { top, height: Math.max(height, 20) };
}

function useNowTick() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function WeeklyCalendar() {
  const now = useNowTick();
  const todayIso = formatDateISO(now);

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
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setAvailability(null);
        setLoadError(
          "Calendar API returned an error. Stop the dev server, run npm run dev:clean, and refresh."
        );
        return;
      }
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
      setLoadError(
        "Could not load the calendar. Try npm run dev:clean, then refresh."
      );
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
    const m = new Map(availability?.days.map((d) => [d.date, d]) ?? []);
    return m;
  }, [availability]);

  const currentTimeTop = useMemo(() => {
    const hour = now.getHours();
    const minute = now.getMinutes();
    if (hour < OPEN_HOUR || hour > CLOSE_HOUR) return null;
    if (hour === CLOSE_HOUR && minute > 0) return null;
    const mins = (hour - OPEN_HOUR) * 60 + minute;
    return (mins / SLOT_MINUTES) * ROW_HEIGHT;
  }, [now]);

  function shiftWeek(delta: number) {
    const next = addDays(parseLocalDate(weekStart), delta * 7);
    setWeekStart(formatDateISO(getWeekStart(next)));
  }

  function goToToday() {
    setWeekStart(formatDateISO(getWeekStart(new Date())));
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

  const isViewingToday = grid.some(({ date }) => date === todayIso);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Monday–Thursday · 9:00 AM–5:00 PM · 15-minute slots
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm hover:bg-zinc-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-50"
            aria-label="Previous week"
          >
            ←
          </button>
          <span className="min-w-[10rem] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-medium shadow-sm">
            {weekLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-zinc-50"
            aria-label="Next week"
          >
            →
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
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[3.5rem_repeat(4,1fr)] border-b border-calendar-line bg-calendar-header">
                <div className="border-r border-calendar-line" />
                {grid.map(({ date }) => {
                  const d = parseLocalDate(date);
                  const isToday = date === todayIso;
                  const dayName = d
                    .toLocaleDateString("en-US", { weekday: "short" })
                    .toUpperCase();
                  const dayInfo = dayMap.get(date);
                  return (
                    <div
                      key={date}
                      className={`border-l border-calendar-line px-2 py-3 text-center ${
                        isToday ? "bg-calendar-today" : ""
                      }`}
                    >
                      <p className="text-[10px] font-medium tracking-wide text-zinc-500">
                        {dayName}
                      </p>
                      <p
                        className={`mt-0.5 text-xl font-semibold leading-none ${
                          isToday ? "text-sky-600" : "text-ink"
                        }`}
                      >
                        {d.getDate()}
                      </p>
                      {dayInfo?.isBlocked && (
                        <span className="mt-1.5 block text-[10px] font-medium text-amber-700">
                          Blocked
                        </span>
                      )}
                    {dayInfo?.isShootDayCapReached && (
                      <span className="mt-1 block text-[10px] font-medium text-zinc-600">
                        2-day limit
                      </span>
                    )}
                    </div>
                  );
                })}
              </div>

              <div className="relative grid grid-cols-[3.5rem_repeat(4,1fr)] bg-calendar-bg">
                <div
                  className="relative border-r border-calendar-line bg-calendar-header"
                  style={{ height: SLOT_COUNT * ROW_HEIGHT }}
                >
                  {grid[0].slots.map((slot, i) => {
                    if (slot.getMinutes() % 30 !== 0) return null;
                    return (
                      <div
                        key={i}
                        className="absolute right-0 left-0 flex items-start justify-end border-b border-calendar-lineSubtle pr-2 text-[10px] font-medium text-zinc-500"
                        style={{
                          top: i * ROW_HEIGHT,
                          height: ROW_HEIGHT * 2,
                        }}
                      >
                        <span className="-translate-y-1.5">
                          {slot.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {grid.map(({ date, slots }) => {
                  const dayInfo = dayMap.get(date);
                  const isToday = date === todayIso;
                  const dayBookings = availability.bookings.filter(
                    (b) => formatDateISO(new Date(b.start_time)) === date
                  );

                  return (
                    <div
                      key={date}
                      className={`relative border-l border-calendar-line ${
                        dayInfo?.isShootDayCapReached
                          ? "bg-zinc-200/50"
                          : isToday
                            ? "bg-calendar-today/50 bg-calendar-cell"
                            : "bg-calendar-cell"
                      }`}
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
                        const Tag = status === "available" ? "button" : "div";
                        return (
                          <Tag
                            key={i}
                            {...(status === "available"
                              ? {
                                  type: "button" as const,
                                  onClick: () =>
                                    handleSlotClick(date, slotStart),
                                }
                              : {})}
                            className={slotRowClass(status, i)}
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

                      {isToday &&
                        isViewingToday &&
                        currentTimeTop !== null && (
                          <div
                            className="pointer-events-none absolute right-0 left-0 z-30 flex items-center"
                            style={{ top: currentTimeTop }}
                            aria-hidden
                          >
                            <div className="h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-white bg-zinc-800 shadow-sm" />
                            <div className="h-px flex-1 bg-zinc-800/70" />
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
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
