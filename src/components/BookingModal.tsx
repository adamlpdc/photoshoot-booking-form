"use client";

import { useEffect, useState } from "react";
import {
  BookingFormFields,
  formValuesToInput,
  type BookingFormValues,
} from "./BookingFormFields";
interface BookingModalProps {
  open: boolean;
  initialValues: BookingFormValues;
  onClose: () => void;
  onSuccess: (result: { editLink: string }) => void;
  mode?: "create";
}

export function BookingModal({
  open,
  initialValues,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setError(null);
    }
  }, [open, initialValues]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValuesToInput(values)),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create booking.");
        return;
      }
      onSuccess({ editLink: data.editLink });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="booking-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 id="booking-modal-title" className="text-lg font-semibold">
            Book a photoshoot
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <BookingFormFields values={values} onChange={setValues} />
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-ink-muted hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Confirming…" : "Confirm booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
