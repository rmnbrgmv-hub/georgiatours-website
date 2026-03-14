# GeorgiaTours Website

Modern, futuristic marketing/booking site for GeorgiaTours. Same Supabase backend as the main app — **same functionality, different design**.

- **Design**: Dark theme, gold + cyan accents, glassmorphism, Syne + Cormorant Garamond. Nod to original app: "Explore Georgia" tagline, gold (#c9a84c).
- **Pages**: Home (hero + featured), Explore (tours grid), Tour detail, Login, Bookings.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or use defaults)
npm run dev
```

## Deploy (Vercel)

Connect the `georgiatours-website` repo to Vercel; build uses `vite build`, output `dist`.

## Env

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
