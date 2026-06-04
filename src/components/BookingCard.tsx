import { displayBrand, formatTimeLabel } from "@/lib/datetime";
import { getDesignerStyles } from "@/lib/calendar-styles";
import type { PublicBooking } from "@/lib/types";

interface BookingCardProps {
  booking: PublicBooking;
  style: React.CSSProperties;
}

export function BookingCard({ booking, style }: BookingCardProps) {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const brand = displayBrand(booking.brand, booking.custom_brand);
  const theme = getDesignerStyles(booking.designer);
  const compact = (style.height as number) < 48;

  return (
    <div
      className={`pointer-events-none absolute inset-x-1.5 z-20 flex min-h-0 overflow-hidden rounded-lg border border-black/[0.06] shadow-sm ${theme.bg}`}
      style={style}
      title={`${brand} · ${booking.designer}`}
    >
      <div className={`w-1 shrink-0 rounded-l-lg ${theme.accent}`} aria-hidden />
      <div className={`flex min-w-0 flex-1 flex-col justify-center px-2 py-1 ${compact ? "py-0.5" : "py-1.5"}`}>
        <p className={`truncate text-xs font-semibold leading-tight ${theme.text}`}>
          {brand}
        </p>
        {!compact && (
          <>
            <p className={`truncate text-[11px] leading-tight ${theme.muted}`}>
              {formatTimeLabel(start)} – {formatTimeLabel(end)}
            </p>
            <p className={`truncate text-[11px] leading-tight ${theme.muted}`}>
              {booking.designer}
            </p>
          </>
        )}
        {compact && (
          <p className={`truncate text-[10px] leading-tight ${theme.muted}`}>
            {formatTimeLabel(start)} · {booking.designer}
          </p>
        )}
      </div>
    </div>
  );
}
