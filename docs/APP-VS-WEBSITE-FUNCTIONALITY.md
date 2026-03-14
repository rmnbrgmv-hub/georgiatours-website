# App vs Website — Functionality Comparison

Same functionality as the app (except UI). This document lists what the **admin app** does and how the **website** compares. ✅ = implemented, ❌ = missing or different, ⚠️ = partial.

---

## 1. TOURIST

### 1.1 Explore
| Feature | App | Website |
|--------|-----|---------|
| List services (tours) from DB | ✅ useServices, services.select | ✅ useServices |
| Filter suspended tours | ✅ | ✅ `!s.suspended` |
| Filter by type (guide/van/transfer) | ✅ | ✅ |
| Filter by region | ✅ | ✅ |
| Filter by max price | ✅ slider | ✅ range + chips |
| Sort (recommended / price / nearest) | ✅ | ❌ No sort options |
| "Near You" / geolocation | ✅ | ❌ |
| Service cards → detail view | ✅ selected service | ✅ Link to /app/tour/:id |
| Book from catalog (Connect & Book / Book & Pay) | ✅ connectAndBookThenChat or PaymentModal | ✅ Tour.jsx "Book now" → bookings.insert |
| Payment modal (when PAYMENT_ENABLED) | ✅ | ❌ Not implemented (website always direct book) |
| Badges on service cards (verified, toprated, etc.) | ✅ BadgeChip from users | ❌ |

### 1.2 Map
| Feature | App | Website |
|--------|-----|---------|
| Map view (Georgia) | ✅ | ✅ |
| Service markers on map | ✅ Click marker → setSelected(service), tab Explore | ❌ No markers; map is static |
| Click marker → open service in Explore | ✅ | ❌ |

### 1.3 Requests
| Feature | App | Website |
|--------|-----|---------|
| Post a request (form) | ✅ TourRequestModal | ✅ Inline form |
| requests.insert (tourist_id, title, description, region, type, date, budget, status) | ✅ | ✅ |
| List my requests | ✅ | ✅ useRequests, filter by touristId |
| Load offers per request | ✅ | ✅ offers.select in request_id |
| Accept offer → bookings.insert + offers update + requests update | ✅ | ✅ |
| Refetch requests after accept | ✅ local state | ✅ refetchRequests() |
| **Confirm Completed** (when provider marked offer provider_confirmed) | ✅ requests.update status "completed" | ❌ No button; request stays "booked" |
| Realtime on requests (INSERT/UPDATE) | ✅ channel requests-tourist | ✅ channel requests-tourist-web |

### 1.4 Bookings
| Feature | App | Website |
|--------|-----|---------|
| List my bookings | ✅ | ✅ |
| Mark as done (tourist_done) | ✅ | ✅ |
| Confirm completion (when provider_done → completed) | ✅ | ✅ |
| "Explore Services" link | ✅ | ✅ |
| Leave a review (ReviewModal) | ✅ handleReview, local state | ❌ No review modal or prompt |
| reviewed flag on booking | ✅ UI only | ✅ Display only |

### 1.5 Chat
| Feature | App | Website |
|--------|-----|---------|
| Partners = providers from my bookings | ✅ | ✅ (tourist) |
| Load messages (from_id/to_id) | ✅ | ✅ |
| Send message (messages.insert) | ✅ | ✅ |
| Realtime new messages | ✅ | ✅ channel messages-* |
| **Message Support** (admin as partner) | ✅ Load admin user, add to chat list / open chat | ❌ Support not in partner list |

### 1.6 Profile
| Feature | App | Website |
|--------|-----|---------|
| Name, email, avatar, stats | ✅ | ✅ |
| Bookings / completed / reviews left | ✅ | ✅ |
| Message Support → opens Chat with admin | ✅ | ❌ No "Message Support" link |
| Sign Out | ✅ | ✅ (in layout) |
| Profile photo upload (users.update profile_picture) | ✅ (provider) | ❌ Not on website Profile |
| Gallery, bio edit (provider in app) | ✅ | N/A tourist |

---

## 2. PROVIDER

### 2.1 Dashboard
| Feature | App | Website |
|--------|-----|---------|
| Earnings, Pending/Confirmed/Completed, Rating | ✅ | ✅ (earnings, bookings count, rating) |
| Pending bookings list | ✅ | ✅ |
| Accept / Decline booking | ✅ bookings.update confirmed/cancelled | ✅ |

### 2.2 My Tours
| Feature | App | Website |
|--------|-----|---------|
| List my services (provider_id = user.id) | ✅ | ✅ |
| Create Tour modal → services.insert | ✅ CreateTourModal | ✅ CreateTourModal |
| Edit Tour → services.update | ✅ | ✅ |
| toServicesRow payload (name, provider_name, provider_id, type, duration, price, etc.) | ✅ | ✅ useAppData.toServicesRow |

### 2.3 Requests (Open requests + My offers)
| Feature | App | Website |
|--------|-----|---------|
| Open requests (status=open), filter by type | ✅ | ✅ |
| Send offer → offers.insert (request_id, provider_id, provider_name, price, duration, description, status) | ✅ | ✅ (+ provider_avatar, provider_color) |
| **My Active Jobs** (accepted offers) | ✅ Fetched, shown in same tab | ❌ Not shown on website |
| **Mark as Completed** on accepted offer | ✅ offers.update status "provider_confirmed" | ❌ No offer completion flow |

### 2.4 Jobs
| Feature | App | Website |
|--------|-----|---------|
| List bookings (provider_id = user.id) | ✅ | ✅ |
| Accept / Decline | ✅ | ✅ |
| Start Job (→ active) | ✅ | ✅ |
| Mark done (→ provider_done) | ✅ | ✅ |
| Complete (→ completed when tourist_done) | ✅ | ✅ |

### 2.5 Chat
| Feature | App | Website |
|--------|-----|---------|
| Partners = tourists from my bookings | ✅ | ✅ (provider) |
| Send / receive messages, realtime | ✅ | ✅ |
| Support (admin) in list | ✅ | ❌ |

### 2.6 Profile (provider)
| Feature | App | Website |
|--------|-----|---------|
| Overview, Gallery, Ratings sub-tabs | ✅ | ❌ Single view only |
| Profile picture upload → users.update profile_picture | ✅ | ❌ |
| Gallery add (local in app) | ✅ | ❌ |

---

## 3. ADMIN

### 3.1 Overview
| Feature | App | Website |
|--------|-----|---------|
| Counts: bookings, requests, providers, tours | ✅ | ✅ |
| Revenue, active bookings, "Needs Attention", Recent Bookings table | ✅ | ❌ Only counts |
| Send Warning / Suspend (overview) | ✅ Toasts only | ❌ |
| Pending Approvals strip | ✅ | ❌ |
| Live map, Providers grid with Message | ✅ | ❌ |

### 3.2 Bookings
| Feature | App | Website |
|--------|-----|---------|
| List all bookings | ✅ | ✅ |
| Filter by status | ✅ bFilter | ❌ |
| **Force complete** stuck booking | ✅ bookings.update status "completed" | ❌ |
| Link to Messages (open chat with tourist) | ✅ | ❌ |

### 3.3 Requests
| Feature | App | Website |
|--------|-----|---------|
| List all requests | ✅ | ✅ |
| **Force complete** request | ✅ requests.update status "completed" | ❌ |

### 3.4 Providers
| Feature | App | Website |
|--------|-----|---------|
| List providers (role=provider) | ✅ | ✅ |
| Verify toggle → users.update verified | ✅ | ✅ |
| **Assign badge** → users.update badges (JSON) | ✅ | ❌ |
| **Remove badge** | ✅ | ❌ |
| Message (open Chat with provider) | ✅ | ❌ |
| profile_picture display | ✅ | ❌ (avatar initials only) |

### 3.5 Tours
| Feature | App | Website |
|--------|-----|---------|
| List all services | ✅ | ✅ |
| Suspend / Resume → services.update suspended | ✅ | ✅ |
| Delete (local only in app) | ✅ | ❌ N/A |

### 3.6 Approvals
| Feature | App | Website |
|--------|-----|---------|
| Pending approvals queue (e.g. new providers) | ✅ UI, Approve/Reject | ⚠️ Placeholder only |
| Approve / Reject (local state in app) | ✅ | ❌ No real queue |

### 3.7 Messages
| Feature | App | Website |
|--------|-----|---------|
| List all non-admin users | ✅ | ❌ |
| Click user → open Chat with that user | ✅ Same ChatView | ❌ Placeholder page only |

---

## 4. SUPABASE OPERATIONS SUMMARY

| Table | Operation | App | Website |
|-------|-----------|-----|---------|
| **services** | select | ✅ | ✅ useServices, AdminTours |
| | insert | ✅ CreateTourModal | ✅ CreateTourModal |
| | update | ✅ Edit tour, Suspend/Resume | ✅ Edit tour, Suspend/Resume |
| **users** | select | ✅ useUsers, admin, profile, support | ✅ App.jsx auth, useUsers, Chat, AdminProviders |
| | insert | ✅ Onboarding/signup | ❌ (auth only) |
| | update | ✅ profile_picture, verified, badges | ✅ verified only |
| **requests** | select | ✅ useRequests, open, admin | ✅ useRequests, useOpenRequests, AdminRequests |
| | insert | ✅ TourRequestModal | ✅ Requests.jsx |
| | update | ✅ booked, completed | ✅ booked only (no "completed" from tourist/admin) |
| **offers** | select | ✅ by request_id, by provider_id | ✅ by request_id (Requests), ProviderRequests uses open requests |
| | insert | ✅ OfferModal | ✅ ProviderRequests |
| | update | ✅ accepted, declined, provider_confirmed | ✅ accepted, declined only |
| **bookings** | select | ✅ tourist, provider, admin | ✅ |
| | insert | ✅ Direct book, accept offer | ✅ |
| | update | ✅ tourist_done, confirmed, cancelled, active, provider_done, completed | ✅ All same |
| **messages** | select | ✅ ChatView | ✅ Chat.jsx |
| | insert | ✅ | ✅ |
| **newsletter_subscribers** | insert | — | ✅ Layout (website-only) |
| **contact_inquiries** | insert | — | ✅ Contact (website-only) |

---

## 5. GAPS TO FIX (priority order)

### High (core flows)
1. **Tourist – Confirm request completed**  
   When an offer has status `provider_confirmed`, show "Confirm Completed" and call `requests.update({ status: 'completed' })`.

2. **Provider – My Active Jobs (accepted offers) + Mark as Completed**  
   On Provider Requests (or separate section), list accepted offers and allow "Mark as Completed" → `offers.update({ status: 'provider_confirmed' })`.

3. **Admin – Force complete booking**  
   In Admin Bookings, add "Force complete" button → `bookings.update({ status: 'completed' })`.

4. **Admin – Force complete request**  
   In Admin Requests, add "Force complete" button → `requests.update({ status: 'completed' })`.

5. **Chat – Message Support**  
   For tourist (and optionally provider): load admin user (e.g. `users.select().eq('role','admin').maybeSingle()`), add Support to Chat partners and/or "Message Support" on Profile that opens Chat with admin.

6. **Admin – Messages**  
   Replace placeholder: list non-admin users, click user → open Chat with that user (reuse Chat component with partner = selected user).

### Medium
7. **Admin – Provider badges**  
   In Admin Providers, add assign/remove badge → `users.update({ badges: JSON.stringify(arr) })`.

8. **Map – Service markers**  
   On Map page, load services, show markers; click marker → navigate to Explore or Tour detail (e.g. `/app/explore?tour=id` or `/app/tour/:id`).

9. **Explore – Sort**  
   Add sort options: recommended (default), price (asc/desc), nearest (if geolocation added).

10. **Profile – Message Support link**  
    Add "Message Support" that opens Chat with admin (depends on #5).

### Lower
11. **Review modal (tourist)**  
    After completion, prompt "Leave a review" (stars + text). App keeps it local only; website can match or add DB later.

12. **Explore – Badges on cards**  
    Show verified/top-rated etc. from users table on tour cards.

13. **Provider Profile – Photo / gallery**  
    Profile picture upload (users.update profile_picture); gallery if desired.

14. **Admin Overview**  
    Optional: recent bookings table, revenue, "Needs Attention", link to Messages.

15. **Notifications panel**  
    App has NotifPanel (🔔); website has no notifications (optional).

---

## 6. ALREADY ALIGNED

- Auth: same user lookup by email, role, provider_type.
- Bookings: insert (direct + accept offer), update (all statuses), list by tourist/provider.
- Requests: insert, list, filter; accept offer flow (except request "completed" and offer "provider_confirmed").
- Offers: insert (with provider_name, etc.); update accepted/declined.
- Services: create/edit tour, suspend/resume; Explore filters (type, region, price).
- Chat: load partners from bookings, load/send messages, realtime.
- Admin: providers list, verify toggle; tours list, suspend/resume; overview counts.
- Collapsible sections and expandable rows for admin and user lists.
- Vercel rewrites for SPA refresh; same Supabase tables and column usage (except optional columns like profile_picture/badges if not used on website).

Use this doc to implement the high-priority gaps first so website functionality matches the app except for UI.
