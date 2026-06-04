export function CalendarLegend() {
  const items = [
    { label: "Available", className: "bg-slot-available border-emerald-200" },
    { label: "Booked", className: "bg-slot-booked border-blue-200" },
    { label: "Blocked", className: "bg-slot-blocked border-amber-200" },
    { label: "Unavailable", className: "bg-slot-unavailable border-zinc-200" },
  ];

  return (
    <div className="flex flex-wrap gap-4 text-sm text-ink-muted">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className={`h-4 w-4 rounded border ${item.className}`}
            aria-hidden
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
