"use client";

interface ConfirmationPanelProps {
  editLink: string;
  onDone: () => void;
}

export function ConfirmationPanel({ editLink, onDone }: ConfirmationPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-emerald-800">
          Booking confirmed
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Your shoot is on the calendar. Save this link to edit or cancel (more
          than 24 hours before start):
        </p>
        <p className="mt-3 break-all rounded-lg border border-zinc-200 bg-white p-3 text-sm font-mono">
          {editLink}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(editLink)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Copy link
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
