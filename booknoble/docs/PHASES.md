# Build phases

Status of each phase from the brief. “Demo data” means fictional records created only by the Settings → *Add sample appointments* testing tool.

| # | Phase | Status | Works now | Still needs |
|---|---|---|---|---|
| 0 | UI preview | ✅ | Design canvas: splash, onboarding, setup, dashboard (dark), calendar (light), interactive customer booking | n/a |
| 1 | Business registration | ✅ | Sign-up/in, email confirmation, password reset (Supabase); demo mode without server | Supabase project + email templates branded |
| 2 | Business setup | ✅ | Profile, booking link with availability check, industry presets, starter services | n/a |
| 3 | Services | ✅ | Create/edit/hide/delete (archives if booked), deposits | n/a |
| 4 | Availability | ✅ | Weekly hours, breaks, time off, buffers, notice, horizon, change window; enforced in app **and** database | Multiple breaks per day (data model supports it; UI edits one) |
| 5 | Customer booking | ✅ | Public page, real open slots, confirmation, manage link reschedule/cancel, deposit checkout hand-off | Host web build on your domain |
| 6 | Appointment management | ✅ | Calendar, detail, status changes, reschedule, owner overrides, conflict protection | Push notifications for new bookings (optional) |
| 7 | Invoices | ✅ | Line items, tax, statuses, share, Stripe payment links + webhook | Stripe account connected |
| 8 | Reminders | ✅ | Settings, template preview, schedule view, server sender with dedupe | Resend/Twilio keys + cron job |
| 9 | Analytics | ✅ | Weekly revenue, trend, top services, busiest day, no-show/cancel/online share | n/a |
| 10 | Subscriptions & publishing | 🟡 | Plans, gating, disclosures, manage link, server-only plan changes, RevenueCat webhook, EAS config, store docs | RevenueCat SDK purchase calls in a dev build; store accounts; review |

## What is demo or placeholder

- **Demo mode** (no Supabase env vars): data lives on one device; sign-in has no password; plan switching is free. Clearly labeled in the UI.
- **Sample data**: only via the testing tool, fictional names with `example.com` emails.
- **Legal text** (`src/content/legal.ts`): template with bracketed fields; needs counsel review.
- **App identifiers**: `app.booknoble.mobile`, the `booknoble.app` domain, EAS project id and App Store Connect id are placeholders in `app.json` / `eas.json`.
- **Brand video / motion assets**: launch, onboarding and confirmation motion is built in code (Reanimated). No AI-generated video has been produced yet. fal.ai video models can turn the splash/banner art into a short promo clip on request (paid, roughly a few dollars per clip).
