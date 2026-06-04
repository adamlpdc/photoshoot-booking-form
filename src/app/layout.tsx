import type { Metadata } from "next";
import Link from "next/link";
import { APP_TITLE } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_TITLE,
  description: "Internal photoshoot booking calendar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              {APP_TITLE}
            </Link>
            <nav className="flex gap-4 text-sm text-ink-muted">
              <Link href="/" className="hover:text-ink">
                Calendar
              </Link>
              <Link href="/admin" className="hover:text-ink">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
