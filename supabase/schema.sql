-- Photoshoot Booking Form — Supabase schema
-- Run this in the Supabase SQL editor for a new project.

create extension if not exists "pgcrypto";

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  custom_brand text,
  title text not null,
  designer text not null,
  attendees text not null,
  description text,
  requester_name text not null,
  requester_email text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  edit_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_start_time_idx on public.bookings (start_time);
create index if not exists bookings_end_time_idx on public.bookings (end_time);

create table if not exists public.blocked_days (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason text,
  blocked_by text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();
