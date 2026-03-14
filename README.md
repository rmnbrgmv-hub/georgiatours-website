# GeorgiaTours Website

Modern, futuristic marketing/booking site for GeorgiaTours. Same Supabase backend as the main app — **same functionality, different design**.

- **Design**: Dark theme, gold + cyan accents, glassmorphism, Syne + Cormorant Garamond. Nod to original app: "Explore Georgia" tagline, gold (#c9a84c).
- **Pages**: Home, Explore (tours), Tour detail, Map, Stories, Contact, Provider profile, Login, Bookings.

## Features

- **Auth**: Email + optional password. Set `VITE_USE_SUPABASE_AUTH=true` to use Supabase Auth (signInWithPassword); otherwise login uses `users` table by email only.
- **App URL**: Set `VITE_APP_URL` to your main app URL so "Book in app" links point to the correct place.
- **Map**: Leaflet map of Georgia with tour pins by region.
- **Reviews**: Tour page shows reviews from the `reviews` table (by provider).
- **Contact / Request a tour**: Form submits to `contact_inquiries` table.
- **Stories**: Static “Stories from Georgia” blog (edit `src/data/stories.js`).
- **Multi-language**: EN / ქართ (ka) / RU. Toggle in header; preference stored in `localStorage`.
- **SEO**: Meta tags and Open Graph on main pages; `public/sitemap.xml` (update host for production).
- **Newsletter**: Footer signup → `newsletter_subscribers` table.
- **Provider profiles**: Public page `/provider/:id` with bio, gallery, and their tours.

## Supabase tables (run in SQL Editor)

Run `supabase/migrations/001_website_tables.sql` in the Supabase SQL Editor to create:

- `contact_inquiries` — name, email, message, tour_interest
- `newsletter_subscribers` — email (unique)

RLS allows anonymous `INSERT` only. The `reviews` table is from the main app; ensure `services` has `provider_id` and `reviews` exists for tour reviews to show.

## Same database as the app

Use the **same Supabase project** as the GeorgiaTours app so that:

- **Users** — same accounts; login on the website uses the same `users` table.
- **Tours** — Explore and Tour pages read from the same `services` table.
- **Bookings** — Bookings page shows the same `bookings` for the logged-in user.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` to your app’s Supabase project (same values as in the app). If you leave them unset, the code uses the same default project as the app.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (same as app), optional VITE_APP_URL, VITE_USE_SUPABASE_AUTH
npm run dev
```

## Deploy (Vercel)

Connect the repo to Vercel; build command `vite build`, output `dist`. Add env vars in Vercel dashboard.

## Env

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- `VITE_APP_URL` — Main app URL for “Book in app” (default: placeholder)
- `VITE_USE_SUPABASE_AUTH` — Set to `"true"` to use Supabase Auth for login
