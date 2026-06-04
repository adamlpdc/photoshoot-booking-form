import { DESIGNER_EVENT_STYLES } from "@/lib/calendar-styles";

export function CalendarLegend() {
  const statusItems = [
    { label: "Available", swatch: "#ffffff", border: "border-zinc-300" },
    { label: "Blocked", swatch: "#fef3c7", border: "border-amber-200" },
    {
      label: "Closed (2 shoot days)",
      swatch: "#e4e4e7",
      border: "border-zinc-300",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-muted">
      <div className="flex flex-wrap gap-4">
        {statusItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className={`h-4 w-4 rounded border ${item.border}`}
              style={{ backgroundColor: item.swatch }}
              aria-hidden
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <span className="hidden h-4 w-px bg-zinc-300 sm:block" aria-hidden />
      <div className="flex flex-wrap gap-4">
        {(Object.entries(DESIGNER_EVENT_STYLES) as [string, (typeof DESIGNER_EVENT_STYLES)["Edi"]][]).map(
          ([id, s]) => (
            <div key={id} className="flex items-center gap-2">
              <span
                className="flex h-4 w-4 overflow-hidden rounded border border-black/10"
                aria-hidden
              >
                <span style={{ backgroundColor: s.accent, width: 4 }} />
                <span className="flex-1" style={{ backgroundColor: s.fill }} />
              </span>
              <span>Booked — {id}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
