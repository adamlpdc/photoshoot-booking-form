import { NextResponse } from "next/server";
import { BookingValidationError } from "./validation";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof BookingValidationError) {
    return jsonError(err.message, 400);
  }
  console.error(err);
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred.";
  return jsonError(message, 500);
}
