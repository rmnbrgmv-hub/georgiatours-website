# App vs Website — Code Comparison (excluding UI)

Logic, data flows, and Supabase usage only. Last updated after parity fixes.

---

## 1. SUPABASE OPERATIONS BY TABLE

### services
| Op     | App | Website |
|--------|-----|---------|
| select | ✅ useServices, admin tours | ✅ useServices, AdminTours, Landing |
| insert | ✅ CreateTourModal | ✅ CreateTourModal (toServicesRow) |
| update | ✅ Edit tour, Suspend/Resume | ✅ CreateTourModal edit, AdminTours suspend/resume |

**Verdict:** Aligned.

---

### users
| Op     | App | Website |
|--------|-----|---------|
| select | ✅ useUsers, admin, support, profile | ✅ App auth, useUsers, Chat (admin + partners), AdminMessages, AdminProviders |
| insert | ✅ Onboarding/signup (insertUser) | ❌ Not in website (relies on Supabase auth / backend) |
| update | ✅ profile_picture, verified, badges | ✅ verified only (AdminProviders) |

**Gaps:**  
- **users.insert** — App has signup/onboarding that inserts into `users`; website uses auth only (no explicit insert in frontend; may be handled by Supabase trigger or separate backend).  
- **users.update profile_picture** — App: provider profile photo; website: not implemented.  
- **users.update badges** — App: assign/remove badge in Admin Providers; website: not implemented.

---

### requests
| Op     | App | Website |
|--------|-----|---------|
| select | ✅ all, open, by ids, admin list | ✅ useRequests, useOpenRequests, AdminRequests |
| insert | ✅ TourRequestModal | ✅ Requests.jsx (tourist_id, title, description, region, type, date, budget, status) |
| update | ✅ booked, completed | ✅ booked (accept offer), completed (tourist Confirm completed + admin Force complete) |

**Verdict:** Aligned (including confirm request completed and force complete).

---

### offers
| Op     | App | Website |
|--------|-----|---------|
| select | ✅ by request_id, by provider_id, status accepted | ✅ Requests (by request_id), ProviderRequests (open + accepted) |
| insert | ✅ OfferModal (request_id, provider_id, provider_name, price, duration, description, status) | ✅ ProviderRequests (+ provider_avatar, provider_color) |
| update | ✅ accepted, declined, provider_confirmed | ✅ accepted/declined (Requests), provider_confirmed (ProviderRequests Mark as completed) |

**Verdict:** Aligned.

---

### bookings
| Op     | App | Website |
|--------|-----|---------|
| select | ✅ by tourist_id, by provider_id, admin all | ✅ Bookings, ProviderDashboard, ProviderJobs, AdminBookings, Chat (partners), useAppData |
| insert | ✅ Direct book, Accept offer | ✅ Tour.jsx (direct), Requests.jsx (accept offer) |
| update | ✅ tourist_done, confirmed, cancelled, active, provider_done, completed | ✅ All same + Admin force complete |

**Verdict:** Aligned.

---

### messages
| Op     | App | Website |
|--------|-----|---------|
| select | ✅ ChatView by from_id/to_id | ✅ Chat.jsx same |
| insert | ✅ send | ✅ Chat.jsx send |

**Verdict:** Aligned.

---

### Other tables (website-only)
- **newsletter_subscribers** — insert (Layout footer).  
- **contact_inquiries** — insert (Contact page).  
No equivalent in app; no conflict.

---

## 2. FLOWS (logic only)

| Flow | App | Website |
|------|-----|---------|
| Tourist: post request | requests.insert, refetch | ✅ same |
| Tourist: accept offer | bookings.insert, offers accepted/declined, requests booked | ✅ same |
| Tourist: confirm request completed | requests.update completed when offer provider_confirmed | ✅ same |
| Tourist: mark booking done / confirm completion | bookings.update tourist_done, completed | ✅ same |
| Tourist: direct book from tour | bookings.insert (connectAndBookThenChat or PaymentModal) | ✅ Tour.jsx bookings.insert (tourist only) |
| Tourist: Message Support | Load admin, open chat | ✅ Support in partners, Profile “Message Support” → Chat |
| Provider: send offer | offers.insert | ✅ same |
| Provider: active jobs (accepted offers) + mark completed | offers.select accepted, offers.update provider_confirmed | ✅ same |
| Provider: accept/decline booking, start job, mark done, complete | bookings.update (confirmed, cancelled, active, provider_done, completed) | ✅ same |
| Provider: create/edit tour | services.insert, services.update (toServicesRow) | ✅ same |
| Admin: force complete booking/request | bookings.update completed, requests.update completed | ✅ same |
| Admin: verify provider | users.update verified | ✅ same |
| Admin: suspend/resume tour | services.update suspended | ✅ same |
| Admin: Messages | List non-admin users, open Chat with user | ✅ AdminMessages (Tourists/Guides/Drivers), navigate to Chat with partnerId |
| Admin: badges | users.update badges (add/remove) | ❌ not implemented |
| Realtime | requests, messages channels | ✅ requests (Requests.jsx), messages (Chat.jsx) |

---

## 3. REMAINING GAPS (code / logic only)

1. **users.insert** — App has onboarding/signup that inserts a row into `users`. Website does not; depends on auth (and possibly DB trigger or API).  
2. **users.update profile_picture** — App: provider profile photo save. Website: no update.  
3. **users.update badges** — App: Admin assign/remove badge. Website: no update.

Everything else in the comparison is aligned (same tables, same operations, same flows). UI (layout, components, styling) is intentionally different.

---

## 4. QUICK REFERENCE: WHERE EACH OPERATION LIVES

**Website:**

- **services:** useAppData (useServices), CreateTourModal, AdminTours, Landing (select only).  
- **users:** App.jsx (auth select), useAppData (useUsers), Chat (admin + partners), AdminMessages, AdminProviders (select + verified update).  
- **requests:** useAppData (useRequests, useOpenRequests), Requests.jsx (insert, update booked + completed), AdminRequests (select + force complete).  
- **offers:** Requests.jsx (select by request_id, update accepted/declined), ProviderRequests (select open + accepted, insert, update provider_confirmed).  
- **bookings:** Bookings, ProviderDashboard, ProviderJobs (select + status updates), AdminBookings (select + force complete), Tour.jsx (insert), Requests.jsx (insert accept offer), Chat (select for partners).  
- **messages:** Chat.jsx (select, insert, realtime).

This document can be used to keep app and website logic in sync when adding or changing features (excluding UI).
