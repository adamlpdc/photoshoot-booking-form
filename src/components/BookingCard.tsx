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
  const height =
    typeof style.height === "number" ? style.height : parseFloat(String(style.height));
  const compact = height < 52;

  return (
    <div
      className="pointer-events-none absolute inset-x-1 z-30 flex min-h-[20px] overflow-hidden rounded-md border border-black/10 shadow-md"
      style={{
        ...style,
        backgroundColor: theme.fill,
      }}
      title={`${brand} · ${booking.designer}`}
    >
      <div
        className="w-1.5 shrink-0"
        style={{ backgroundColor: theme.accent }}
        aria-hidden
      />
      <div
        className={`flex min-w-0 flex-1 flex-col justify-center px-2 ${
          compact ? "py-0.5" : "py-1.5"
        }`}
      >
        <p className={`truncate text-xs font-semibold leading-tight ${theme.textClass}`}>
          {brand}
        </p>
        {!compact && (
          <>
            <p className={`truncate text-[11px] leading-tight ${theme.mutedClass}`}>
              {formatTimeLabel(start)} – {formatTimeLabel(end)}
            </p>
            <p className={`truncate text-[11px] leading-tight ${theme.mutedClass}`}>
              {booking.designer}
            </p>
          </>
        )}
        {compact && (
          <p className={`truncate text-[10px] leading-tight ${theme.mutedClass}`}>
            {formatTimeLabel(start)} · {booking.designer}
          </p>
        )}
      </div>
    </div>
  );
}
