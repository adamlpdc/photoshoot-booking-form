import { displayBrand, formatTimeLabel } from "@/lib/datetime";
import type { PublicBooking } from "@/lib/types";

interface BookingCardProps {
  booking: PublicBooking;
  style: React.CSSProperties;
}

export function BookingCard({ booking, style }: BookingCardProps) {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const brand = displayBrand(booking.brand, booking.custom_brand);

  return (
    <div
      className="pointer-events-none absolute inset-x-0.5 z-10 overflow-hidden rounded-md border border-blue-300 bg-slot-booked px-1.5 py-1 text-xs shadow-sm"
      style={style}
      title={`${brand} · ${booking.designer}`}
    >
      <p className="truncate font-medium text-ink">{brand}</p>
      <p className="truncate text-ink-muted">
        {formatTimeLabel(start)} – {formatTimeLabel(end)}
      </p>
      <p className="truncate text-ink-muted">{booking.designer}</p>
    </div>
  );
}
