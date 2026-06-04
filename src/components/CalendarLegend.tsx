import { DESIGNER_EVENT_STYLES } from "@/lib/calendar-styles";

export function CalendarLegend() {
  const statusItems = [
    { label: "Available", className: "border-calendar-line bg-white" },
    { label: "Blocked", className: "border-amber-200 bg-amber-50" },
    { label: "Unavailable", className: "border-zinc-200 bg-zinc-100" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-muted">
      <div className="flex flex-wrap gap-4">
        {statusItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className={`h-4 w-4 rounded border ${item.className}`}
              aria-hidden
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <span className="hidden h-4 w-px bg-zinc-300 sm:block" aria-hidden />
      <div className="flex flex-wrap gap-4">
        {(Object.keys(DESIGNER_EVENT_STYLES) as Array<keyof typeof DESIGNER_EVENT_STYLES>).map(
          (id) => {
            const s = DESIGNER_EVENT_STYLES[id];
            return (
              <div key={id} className="flex items-center gap-2">
                <span
                  className={`flex h-4 w-4 overflow-hidden rounded border border-black/[0.06] ${s.bg}`}
                  aria-hidden
                >
                  <span className={`w-1 ${s.accent}`} />
                </span>
                <span>{id}</span>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
