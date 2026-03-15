# GeorgiaTours Website

Web frontend for GeorgiaTours — **same functionality as the app**, modern UI, same database. Use as admin, tourist, guide, or driver from the browser.

- **Flow**: Landing → Sign in → Role-based app (Tourist / Provider / Admin).
- **Design**: Dark and light themes, gold + cyan accents, glassmorphism. Responsive sidebar layout.
- **Languages**: English, Russian, Georgian (ქართ), Arabic — with RTL for Arabic.
- **Same DB**: Connects to the same Supabase project as the GeorgiaTours app; same `users`, `services`, `bookings`, `requests`, `offers`, `messages`.

## Role-based areas

- **Tourist**: Explore, Map, Requests, Bookings, Chat, Profile.
- **Provider** (guide/driver): Dashboard, My Tours, Requests (send offers), Jobs (bookings), Chat, Profile.
- **Admin**: Overview, Bookings, Requests, Providers, Tours, Approvals, Messages.

After login you are redirected to the correct default tab for your role.

## Features

- **Auth**: Supabase Auth only — email + password; session from `getSession()`; user profile from `users` by `auth.uid()`.
- **Theme**: Light/dark toggle in header; preference in `localStorage`.
- **Locale**: EN / ქართ / Ru / العربية in header; `document.dir` set to RTL for Arabic.
- **Shared data layer**: `src/hooks/useAppData.js` — same row mappers and hooks as the app (`mapServiceRow`, `mapUserRow`, `mapRequestRow`, `mapBookingRow`, `useServices`, `useRequests`, etc.).
- **Public tour page**: `/tour/:id` and `/app/tour/:id` (when inside app). “Book in app” uses `VITE_APP_URL` if set.

## Same database as the app

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` to the **same** Supabase project as the GeorgiaTours app. Tables used: `users`, `services`, `bookings`, `requests`, `offers`, `messages`, `reviews`, etc.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (same as app), optional VITE_APP_URL
npm run dev
```

## Deploy (e.g. Vercel)

Build command: `npm run build` (Vite). Output: `dist`. Add env vars in the dashboard.

## Env

- `VITE_SUPABASE_URL` — Supabase project URL (same as app)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (same as app)
- `VITE_APP_URL` — Main app URL for “Book in app”
