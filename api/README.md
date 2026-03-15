# Signup API

`POST /api/signup` creates a user via the Supabase Admin API (no confirmation email), so sign-up is not blocked by email rate limits.

**Required in Vercel** (Project → Settings → Environment Variables):

- `SUPABASE_URL` — your Supabase project URL (e.g. `https://xxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Dashboard → Settings → API → service_role (secret)

After adding these, redeploy. Sign-up on the site will use this API and avoid "too many sign-up attempts" errors.
