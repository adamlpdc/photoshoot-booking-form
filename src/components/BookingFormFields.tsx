"use client";

import { useEffect, useState } from "react";
import { BRANDS, DESIGNERS } from "@/lib/constants";
import {
  formatDateUKFromIso,
  generateTimeOptions,
  parseUKDateInput,
} from "@/lib/datetime";
import type { BookingFormInput, BrandOption, DesignerId } from "@/lib/types";

export interface BookingFormValues {
  brand: BrandOption;
  customBrand: string;
  title: string;
  designer: DesignerId;
  attendees: string;
  description: string;
  requesterName: string;
  requesterEmail: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface BookingFormFieldsProps {
  values: BookingFormValues;
  onChange: (values: BookingFormValues) => void;
  disabled?: boolean;
}

const timeOptions = generateTimeOptions();

export function BookingFormFields({
  values,
  onChange,
  disabled,
}: BookingFormFieldsProps) {
  const set = <K extends keyof BookingFormValues>(
    key: K,
    value: BookingFormValues[K]
  ) => onChange({ ...values, [key]: value });

  const [dateText, setDateText] = useState(() =>
    formatDateUKFromIso(values.date)
  );

  useEffect(() => {
    setDateText(formatDateUKFromIso(values.date));
  }, [values.date]);

  const inputClass =
    "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:bg-zinc-100";

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Brand</label>
        <select
          className={inputClass}
          value={values.brand}
          disabled={disabled}
          onChange={(e) => set("brand", e.target.value as BrandOption)}
        >
          {BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {values.brand === "Other" && (
        <div>
          <label className="text-sm font-medium">Custom brand name</label>
          <input
            className={inputClass}
            required
            disabled={disabled}
            value={values.customBrand}
            onChange={(e) => set("customBrand", e.target.value)}
            placeholder="Enter brand name"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Shoot title</label>
        <input
          className={inputClass}
          required
          disabled={disabled}
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Designer</label>
        <select
          className={inputClass}
          value={values.designer}
          disabled={disabled}
          onChange={(e) => set("designer", e.target.value as DesignerId)}
        >
          {DESIGNERS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Who is going to be there</label>
        <input
          className={inputClass}
          required
          disabled={disabled}
          value={values.attendees}
          onChange={(e) => set("attendees", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          className={inputClass}
          rows={3}
          disabled={disabled}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Your name</label>
          <input
            className={inputClass}
            required
            disabled={disabled}
            value={values.requesterName}
            onChange={(e) => set("requesterName", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Your email</label>
          <input
            type="email"
            className={inputClass}
            required
            disabled={disabled}
            value={values.requesterEmail}
            onChange={(e) => set("requesterEmail", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Date</label>
        <input
          type="text"
          inputMode="numeric"
          className={inputClass}
          required
          disabled={disabled}
          placeholder="DD/MM/YY"
          value={dateText}
          onChange={(e) => {
            setDateText(e.target.value);
            const iso = parseUKDateInput(e.target.value);
            if (iso) set("date", iso);
          }}
          onBlur={() => {
            const iso = parseUKDateInput(dateText);
            if (iso) {
              set("date", iso);
              setDateText(formatDateUKFromIso(iso));
            } else {
              setDateText(formatDateUKFromIso(values.date));
            }
          }}
        />
        <p className="mt-1 text-xs text-ink-muted">UK format (DD/MM/YY), GMT</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Start time</label>
          <select
            className={inputClass}
            required
            disabled={disabled}
            value={values.startTime}
            onChange={(e) => set("startTime", e.target.value)}
          >
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">End time</label>
          <select
            className={inputClass}
            required
            disabled={disabled}
            value={values.endTime}
            onChange={(e) => set("endTime", e.target.value)}
          >
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export function formValuesToInput(
  values: BookingFormValues
): BookingFormInput {
  return {
    brand: values.brand,
    customBrand: values.customBrand || undefined,
    title: values.title,
    designer: values.designer,
    attendees: values.attendees,
    description: values.description || undefined,
    requesterName: values.requesterName,
    requesterEmail: values.requesterEmail,
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
  };
}
