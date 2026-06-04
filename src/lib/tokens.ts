import { randomBytes } from "crypto";

export function generateEditToken(): string {
  return randomBytes(32).toString("hex");
}

export function getEditLink(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}/booking/${token}`;
}
