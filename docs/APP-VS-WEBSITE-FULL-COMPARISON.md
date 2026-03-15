# App vs Website — Full Comparison (elements & mechanisms, excluding UI)

All functional elements and mechanisms. UI/layout/styling excluded.

---

## 1. AUTH & USER

| Element | App | Website |
|--------|-----|---------|
| Login | Email + optional password; fetch user from `users` by email | Supabase auth signIn or same email lookup |
| Signup | insert into `users` (name, email, role, provider_type, avatar, color, …) | Signup mode: auth.signUp + insert into `users` |
| Session | In-memory user, logout clears | Supabase session + sync from `users` by email; sessionStorage cache |
| User shape | id, name, email, role, type, avatar, color, bio, rating, totalBookings, earnings, vehicle_*, verified, badges, profile_picture, gallery | Same (mapUserRow); profile_picture, badges used |

**Verdict:** Aligned (signup insert, profile_picture, badges were added to website).

---

## 2. SUPABASE TABLES & OPERATIONS

| Table | Select | Insert | Update | App notes | Website notes |
|-------|--------|--------|--------|------------|---------------|
| **services** | ✅ | ✅ Create tour | ✅ Edit, suspend/resume | toServicesRow, photos | Same; CreateTourModal with photos |
| **users** | ✅ | ✅ Signup | ✅ verified, badges, profile_picture, (gallery) | Profile: gallery in state, refetch from users | verified, badges, profile_picture; gallery not yet saved |
| **requests** | ✅ | ✅ Post request | ✅ booked, completed | TourRequestModal | Requests.jsx form, confirm completed, force complete |
| **offers** | ✅ | ✅ Send offer | ✅ accepted, declined, provider_confirmed | OfferModal | ProviderRequests |
| **bookings** | ✅ | ✅ Direct book, accept offer | ✅ status flow, (reviewed) | tourist_done, provider_done, completed, reviewed local only | Same statuses; reviewed can be persisted on website |
| **messages** | ✅ | ✅ Send | — | Realtime | Same + realtime |
| **reviews** | — | — | — | App does not insert (review modal is local only) | Website Tour fetches by provider_id; can insert on “Leave review” |

---

## 3. FLOWS BY ROLE

### Tourist
- Post trip request: requests.insert ✅ both
- Accept offer: bookings.insert, offers update, requests booked ✅ both
- Confirm request completed: requests.update completed when offer provider_confirmed ✅ both
- Mark booking “done” (tourist_done): bookings.update ✅ both
- Confirm completion (provider_done → completed): bookings.update ✅ both
- Direct book from tour: bookings.insert ✅ both
- Leave a review: App = local state only (reviewed: true); Website = add modal + bookings.update reviewed + reviews.insert ✅ to add
- Message Support: open chat with admin ✅ both
- Realtime requests: channel on requests ✅ both

### Provider
- Create/edit tour: services insert/update, photos ✅ both
- Send offer: offers.insert ✅ both
- My active jobs (accepted offers): list + mark provider_confirmed ✅ both
- Accept/decline booking: bookings.update confirmed/cancelled ✅ both
- Start job: bookings.update active ✅ both
- Mark job done: bookings.update provider_done ✅ both
- Complete job: bookings.update completed ✅ both
- Profile: profile_picture upload → users.update ✅ both
- Profile: gallery (add photos, display): App has UI + refetch from users; persistence to users.gallery unclear in app. Website: can add gallery upload + users.update gallery for providers.

### Admin
- Force complete booking/request ✅ both
- Verify provider ✅ both
- Assign/remove badges ✅ both
- Suspend/resume tour ✅ both
- Messages: list users by role, open chat ✅ both
- Overview counts, bookings/requests/providers/tours/approvals ✅ both

---

## 4. MECHANISMS (logic only)

| Mechanism | App | Website |
|-----------|-----|---------|
| Tab / section switching | State `tab` + conditionals | Routes + NavLink |
| Realtime: requests | supabase.channel + postgres_changes INSERT/UPDATE | Same in Requests.jsx |
| Realtime: messages | supabase.channel + postgres_changes | Same in Chat.jsx |
| Bookings poll | setInterval 5s refetch | Same in Bookings.jsx |
| Support partner | Admin user in chat partners | Same |
| Offer payload | request_id, provider_id, provider_name, price, duration, description, status | + provider_avatar, provider_color |
| Service/tour payload | toServicesRow (name, type, region, photos, …) | Same |
| Stuck bookings (48h+) | Admin sees; provider “Awaiting confirmation 48h+” | AdminBookings can show; ProviderJobs can show same logic |
| Payment | PaymentModal when PAYMENT_ENABLED; else “Connect & Book” | No payment modal; direct book (same as PAYMENT_ENABLED false) |
| Notifications | NotifPanel, auto notifs for new offers | No notification panel (optional add-on) |
| Geolocation | For “Near you”, default region | Website can add if needed |
| Profile sub-tabs (provider) | Overview, Gallery, Ratings | Single profile; can add Gallery (and Ratings) section |

---

## 5. GAPS ADDRESSED ON WEBSITE (excluding UI)

1. **Leave a Review (tourist)** ✅  
   - App: ReviewModal + handleReview only set local `reviewed: true`.  
   - Website: “Leave a Review” for completed && !reviewed; ReviewModal with stars + text; on submit: `bookings.update({ reviewed: true })` and `reviews.insert({ provider_id, rating, text, tourist_name, date })` (Bookings.jsx).

2. **Provider profile gallery save** ✅  
   - App: Gallery UI and refetch from users.  
   - Website: Profile (provider only): gallery state, add/remove photos, “Save gallery” → `users.update({ gallery: JSON.stringify(arr) })`. mapUserRow + auth sync include `gallery`.

3. **Stuck bookings / 48h indicator (optional)**  
   - App: Shows “Awaiting confirmation 48h+” on provider jobs.  
   - Website: Can add same logic in ProviderJobs and AdminBookings if desired.

4. **Profile sub-sections for provider (optional)**  
   - App: Overview, Gallery, Ratings tabs.  
   - Website: Single profile with Gallery block for provider; Ratings can be added later if needed.

---

## 6. ALREADY ALIGNED (no change needed)

- Auth, signup, session, user shape  
- All Supabase CRUD for services, requests, offers, bookings, messages  
- users: verified, badges, profile_picture  
- Tourist: post request, accept offer, confirm completed, mark done, confirm completion, direct book, Message Support, realtime requests  
- Provider: create/edit tour with photos, send offer, active jobs + mark completed, accept/decline/start/done/complete booking, profile picture  
- Admin: force complete, verify, badges, suspend/resume, messages by role  
- Tab creation logic (state vs routes) — different mechanism, same destinations  

---

## 7. QUICK REFERENCE: FILES

**Website:**  
- Auth/session: App.jsx, Login.jsx  
- Services: useAppData (useServices), CreateTourModal, AdminTours, Landing  
- Users: App.jsx, useUsers, Chat, AdminMessages, AdminProviders, Profile (profile_picture)  
- Requests: useRequests, useOpenRequests, Requests.jsx, AdminRequests  
- Offers: Requests.jsx, ProviderRequests  
- Bookings: Bookings, ProviderDashboard, ProviderJobs, AdminBookings, Tour.jsx, Requests.jsx  
- Messages: Chat.jsx  
- Reviews: Tour.jsx (select by provider_id); to add: Bookings review modal + insert  

This doc is the single reference for “all elements and mechanisms” (excluding UI). Add any new mechanism to the doc when implementing.
