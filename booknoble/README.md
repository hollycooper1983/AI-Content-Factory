# BookNoble

**Booked. Organized. Growing.**

BookNoble is a subscription booking and business-management app for appointment-based service businesses: hair stylists, nail technicians, housekeepers, mobile detailers, decorators, party-rental companies and more. Owners manage their day in the iOS/Android app; customers book through a shareable web link without installing anything.

| | |
|---|---|
| App | React Native + Expo SDK 58, TypeScript, Expo Router, Reanimated 4 |
| Backend | Supabase Auth + PostgreSQL with Row Level Security, Edge Functions |
| Payments | Stripe Connect for customer deposits/invoices (card data never touches BookNoble) |
| Subscriptions | Apple IAP / Google Play Billing (via RevenueCat) on mobile; Stripe Billing on web |
| Build & ship | EAS Build / EAS Submit, web export for the booking pages |

## What works today

Everything below runs on real, persisted data. No screen is a static mockup.

**Business owner**
- Animated logo reveal, 3-step onboarding, sign-up/sign-in (Supabase email + password)
- Business setup: profile, booking link, industry selection with tailored starter services and buffers
- Dashboard: weekly booked revenue (animated chart), today's agenda, next-up card, outstanding payments, share link
- Calendar: day strip, timeline of appointments, breaks and **open gaps you can tap to book**
- Appointments: create, reschedule, accept, complete, no-show, cancel/restore; deposit tracking; customer manage link
- Services & pricing: duration, price, deposit, hide/show, archive-on-delete to keep history
- Hours & availability: weekly hours, breaks, holidays/time off, buffers, notice, booking horizon, online-change window
- Clients: directory with search, profiles with visit history, spend, notes, call/text/book shortcuts
- Invoices: line items, tax, due date, draft → send → paid/void; Stripe payment link when connected
- Reminders: channels, timing, editable template with live preview, upcoming schedule (sent by a server cron job)
- Insights: revenue trend, top services, busiest day, no-show/cancel rates, online-booking share
- Subscription: Free / Starter $9.99 / Pro $19.99 with feature gating, required disclosures, manage/cancel link
- Settings: light/dark/system theme, deposits, Stripe Connect, sign out, **in-app account deletion**

**Customer (web link, no install)**
- `/b/<business>`: choose service → date & time (only truly open slots) → details → animated confirmation
- Deposits via Stripe Checkout when the business enables them
- `/manage/<token>`: reschedule or cancel within the business's change window

**Guarantees**
- **No double-bookings**: the client computes open slots, and PostgreSQL enforces it atomically with an exclusion constraint (buffers included), so two customers can never take the same time.
- **Data isolation**: Row Level Security limits every table to its owner; the public booking API exposes busy *times* only, never who or what.
- Owners cannot grant themselves a paid plan: only server webhooks can change `plan`.

## Two data modes

| Mode | When | Notes |
|---|---|---|
| **Demo mode** (on-device) | `EXPO_PUBLIC_SUPABASE_*` not set | Everything works in one browser/device. No passwords, nothing uploaded. Settings → *Add sample appointments* fills in fictional data for testing. Subscription plans can be switched for free to try gated features. |
| **Live mode** (Supabase) | Supabase env vars set | Real accounts, multi-device, public booking pages reachable by anyone, reminders, payments. |

## Quick start (Chromebook friendly)

See **[docs/SETUP.md](docs/SETUP.md)**. The short version, using GitHub Codespaces in the browser:

```bash
cd booknoble
npm install
npm run web          # opens the app in a browser tab (demo mode)
npm run check        # typecheck + scheduling tests
```

## Project map

```
src/app/                 Expo Router screens
  onboarding, sign-in, setup                  first-run flow
  (owner)/(tabs)/home|calendar|clients|insights|more
  (owner)/appointment, services, availability, client, invoices, reminders, subscription, settings
  b/[slug], manage/[token], delete-account, privacy, terms, paid   public web pages
src/components/          design-system components (Button, Card, Field, DateStrip, SlotGrid, …)
src/lib/scheduling.ts    slot engine + time zones (unit-tested in tests/)
src/lib/data/            Repository interface, Supabase + on-device implementations, booking rules
src/theme/               brand tokens, light/dark palettes, reduced-motion aware theme
supabase/migrations/     schema, RLS, exclusion constraint, public booking RPCs
supabase/functions/      delete-account, payments, stripe-webhook, send-reminders, revenuecat-webhook, generate-asset (fal.ai)
supabase/tests/          SQL tests for RLS and double-booking
assets/brand/            fal.ai brand photography + manifest (provenance/licensing), rendered logo files
assets/store/            store artwork (Play feature graphic)
docs/                    setup, billing policy, store listing, launch checklist, brand guide
```

## Docs

- [SETUP.md](docs/SETUP.md): Chromebook setup, Supabase, Stripe, reminders, hosting, EAS
- [BILLING.md](docs/BILLING.md): Apple/Google subscription rules and the recommended approach
- [STORE_LISTING.md](docs/STORE_LISTING.md): store copy, App Privacy, Data safety, review notes
- [LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md): testing, accessibility, TestFlight, Play testing
- [BRAND.md](docs/BRAND.md): colors, type, logo, imagery and motion rules
- [PHASES.md](docs/PHASES.md): build phases and what is still demo-only

BookNoble is **not published** on any store yet. Publishing requires the accounts and review steps in the launch checklist.
