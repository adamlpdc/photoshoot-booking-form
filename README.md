# Photoshoot Booking Form

Internal no-login booking calendar for studio photoshoots (Monday–Thursday, 9 AM–5 PM).

## Stack

- [Next.js](https://nextjs.org/) App Router + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (Postgres)
- Deployable on [Vercel](https://vercel.com/)

## Booking rules

| Rule | Behavior |
|------|----------|
| Days | Monday–Thursday only |
| Dates | UK format **DD/MM/YY** (stored as ISO internally) |
| Hours | 9:00 AM–5:00 PM **GMT** (UTC) |
| Increments | 1 hour (on the hour) |
| Studio capacity | One shoot at a time (global) |
| Weekly cap | **Max 2 shoot days per week** (shared across Edi and Sol) |
| Confirmation | Instant |
| Edit / cancel | Only if start is **more than 24 hours** away |
| Admin | Full-day blocks via `ADMIN_PASSWORD` |

### Two shoot days per week

The studio allows at most **two distinct calendar days** with shoots in a given week. Once two different Mon–Thu days already have bookings, **all other** Mon–Thu days in that week are unavailable—even if time slots on those two days are still open.

You **can** add more bookings on a day that is already one of the week’s two shoot days (still subject to no overlapping times and one shoot at a time).

See `src/lib/booking-rules.ts` for implementation and comments.

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com/).
2. Open **SQL Editor** and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy **Project URL**, **anon key**, and **service role key** from **Settings → API**.

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (reserved for future client use)
- `SUPABASE_SERVICE_ROLE_KEY` (server API routes only)
- `ADMIN_PASSWORD` (day blocking; never commit real values)
- `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` or your Vercel URL)

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. GitHub + Vercel (demo deploy)

**GitHub**

```bash
# After creating an empty repo on github.com (e.g. photoshoot-booking-form)
git remote add origin https://github.com/YOUR_USERNAME/photoshoot-booking-form.git
git push -u origin main
```

**Vercel**

1. [vercel.com/new](https://vercel.com/new) → Import your GitHub repo.
2. Framework preset: **Next.js** (defaults are fine).
3. **Environment variables** (Production + Preview):

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role secret |
| `ADMIN_PASSWORD` | Your admin password for `/admin` |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR_PROJECT.vercel.app` (set after first deploy, then redeploy) |
4. Deploy. Copy the production URL, set `NEXT_PUBLIC_APP_URL` to that URL, **Redeploy** so booking edit links work.

## Pages

| Path | Purpose |
|------|---------|
| `/` | Weekly calendar + booking modal |
| `/booking/[token]` | Edit or cancel via secure edit link |
| `/admin` | Block / unblock days (password required) |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bookings?weekStart=YYYY-MM-DD` | Public bookings for week |
| POST | `/api/bookings` | Create booking |
| PATCH | `/api/bookings/[id]` | Update (requires `editToken` in body) |
| DELETE | `/api/bookings/[id]` | Cancel (requires `editToken` in body) |
| GET | `/api/availability?weekStart=YYYY-MM-DD` | Week availability + blocked days |
| POST | `/api/admin/block-day` | Block day (`date`, `password`, optional `reason`) |
| DELETE | `/api/admin/block-day` | Unblock day (`date`, `password`) |
| GET | `/api/booking-by-token/[token]` | Full booking for edit page |

## Office 365 (stub)

`sendBookingNotifications()` in `src/lib/notifications.ts` logs invite payloads today. Wire Microsoft Graph (calendar event + email) there when ready.

## Designers

- **Edi** — ehidalgo@pdcwellness.com  
- **Sol** — HYoo@pdcwellness.com  

Notifications use these addresses in the stub payload.

## License

Private internal use.
