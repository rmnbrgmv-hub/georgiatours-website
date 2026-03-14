-- Run in Supabase SQL Editor if not using CLI.
-- Contact form submissions and newsletter signups for the website.

-- Contact / Request a tour form
create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  tour_interest text,
  created_at timestamptz default now()
);

-- Newsletter subscribers
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

-- Allow anonymous inserts (website visitors)
alter table public.contact_inquiries enable row level security;
alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Allow insert contact_inquiries" on public.contact_inquiries;
create policy "Allow insert contact_inquiries" on public.contact_inquiries for insert with check (true);

drop policy if exists "Allow insert newsletter_subscribers" on public.newsletter_subscribers;
create policy "Allow insert newsletter_subscribers" on public.newsletter_subscribers for insert with check (true);
