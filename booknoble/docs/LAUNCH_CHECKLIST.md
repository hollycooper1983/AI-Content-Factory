# Launch checklist

BookNoble is ready for testing. It is **not** published. Work through this list in order.

## 1. Automated checks (every change)

```bash
npm run check          # TypeScript + scheduling engine tests (time zones, DST, breaks, buffers, conflicts)
npm run build:web      # production web build must succeed
```

Database: run `supabase/tests/rls_and_booking.sql` (see `supabase/tests/README.md`). It verifies:
owners can't self-upgrade plans, businesses can't read each other's data, overlapping/buffer-violating bookings are rejected, customers can't book outside hours, the Free cap, manage-link reschedule/cancel, and that account deletion cascades.

## 2. Manual test script

Use two browsers (or one private window) to act as owner and customer.

| # | Step | Expected |
|---|---|---|
| 1 | Fresh install → onboarding → Create account | Logo reveal, 3 onboarding pages, sign-up. Live mode: confirmation email arrives |
| 2 | Setup: name, link, industry, starter services | Lands on dashboard; services exist; hours default Mon–Fri 9–5 with lunch, Sat 10–3 |
| 3 | Copy booking link → open as customer | Services list shows; Sunday is greyed out |
| 4 | Book a slot as customer | Confirmation animation; owner dashboard/calendar shows it |
| 5 | Customer 2 tries the same slot (stale page) | “That time was just booked” and the slot list refreshes |
| 6 | Owner books overlapping time with Custom time | Refused with an overlap message |
| 7 | Add a holiday covering tomorrow | Customer can't select that date |
| 8 | Change buffer to 30 min | Fewer, wider-spaced slots offered |
| 9 | Customer opens manage link (> window) → reschedule | Moves; owner sees the new time |
| 10 | Manage link inside the change window | Explains to contact the business |
| 11 | Free plan: try Clients, Invoices, Insights | Upgrade cards appear (gating) |
| 12 | Settings → Delete account | Account and data removed; can sign up again with same email |
| 13 | Turn on OS dark mode | All screens readable in dark theme |
| 14 | Turn on Reduce Motion (iOS) / Remove animations (Android) | No springs or slides; fades or instant |
| 15 | Airplane mode on dashboard → pull to refresh | Error banner with Retry, no crash |

## 3. Accessibility

- [x] Text/background pairs meet WCAG AA in both themes (tokens in `src/theme/tokens.ts`)
- [x] All touch targets ≥ 44 pt; icon buttons have `accessibilityLabel`
- [x] Inputs have labels; errors announced as text; steppers are `adjustable` with increment/decrement actions
- [x] Font scaling respected (capped at 1.6× on dense text to avoid clipping)
- [x] Reduced motion respected (Reanimated `ReduceMotion.System` + `AccessibilityInfo`)
- [ ] VoiceOver and TalkBack pass over every screen on real devices
- [ ] Largest Dynamic Type size: check headers and cards for truncation

## 4. Crash handling & monitoring

- Root `ErrorBoundary` (`src/app/_layout.tsx`) catches render errors with a friendly retry screen.
- Data errors surface as inline banners with Retry, never blank screens.
- Before launch, add crash reporting: `npx expo install @sentry/react-native` plus its config plugin, then update the privacy answers (crash data).

## 5. Security

- [x] RLS on every table; public API exposes busy times only
- [x] No secrets in the client; Stripe, fal.ai, Twilio and service-role keys live only in Edge Function secrets
- [x] Card data handled exclusively by Stripe Checkout
- [x] Manage links use 48-hex-character random tokens
- [ ] Turn on Supabase **leaked-password protection** and set minimum password length to 8+
- [ ] Turn on Supabase **CAPTCHA** (Auth → Bot protection) for sign-up and consider rate limits on `create_public_booking` (e.g. Cloudflare in front of the web app)
- [ ] Have counsel review `src/content/legal.ts` and fill the bracketed fields

## 6. TestFlight (iOS)

1. Apple Developer Program → App Store Connect → **New App** (bundle id `app.booknoble.mobile`).
2. `npx eas-cli@latest build -p ios --profile production` → `npx eas-cli@latest submit -p ios`.
3. App Store Connect → TestFlight → add **Internal testers** (instant) or an **External** group (needs Beta App Review, usually < 1 day).
4. Testers install via the TestFlight app.

## 7. Google Play testing

1. Play Console → **Create app** → complete *App content*: privacy policy, ads (none), data safety, target audience (18+ business), account deletion URL.
2. `npx eas-cli@latest build -p android --profile production` → `npx eas-cli@latest submit -p android` (uploads to **Internal testing** as a draft). The first upload may need to be done by hand in Play Console.
3. Add testers by email list; share the opt-in link.
4. **New personal developer accounts** must run a **closed test with at least 12 testers for 14 consecutive days** before applying for production access. Plan for it.

## 8. Production submission

- [ ] IAP products approved and attached to the version (see BILLING.md)
- [ ] Screenshots, descriptions, privacy answers (STORE_LISTING.md)
- [ ] Demo reviewer account with sample data
- [ ] Web booking pages and `/privacy`, `/terms`, `/delete-account` live on your domain
- [ ] Submit for review. The app is published only once Apple/Google approve **and** you release it.
