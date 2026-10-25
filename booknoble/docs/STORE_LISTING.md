# Store listing & compliance answers

Drafts to paste into App Store Connect and Google Play Console. Replace bracketed values.

## Names and copy

- **App name:** BookNoble
- **iOS subtitle (30):** Booking for service businesses
- **Play short description (80):** Online booking, clients, invoices and reminders for appointment businesses.
- **Promotional text (170):** Share one link and get booked 24/7. No double-bookings, automatic reminders, invoices and insights, all in one premium app.
- **Keywords (iOS, 100):** booking,appointments,scheduler,salon,barber,nails,detailing,cleaning,calendar,invoice,clients,reminders

**Full description**

> Booked. Organized. Growing.
>
> BookNoble is the premium booking app for appointment-based businesses: hair stylists, nail technicians, housekeepers, mobile detailers, decorators, party-rental companies and more.
>
> GET BOOKED ONLINE
> • Your own booking link. Clients book 24/7 from any browser, with no download needed
> • Only truly open times are offered: hours, breaks, holidays and buffer times built in
> • No double-bookings, guaranteed
> • Clients can reschedule or cancel themselves within your rules
>
> RUN YOUR DAY
> • Beautiful calendar with open-gap booking
> • Services with prices, durations and deposits
> • Client directory with visit history and private notes
> • Automatic email and text reminders
>
> GET PAID AND GROW
> • Invoices and secure payment requests through Stripe
> • Deposits at booking to reduce no-shows
> • Insights: revenue, top services, busiest days, no-show rate
>
> PLANS
> Free: business profile and basic booking. Starter ($9.99/mo): unlimited appointments, reminders, client management. Pro ($19.99/mo): invoicing, analytics and advanced scheduling. Subscriptions renew monthly until cancelled; manage them in your store account.
>
> Terms: [https://booknoble.app/terms] · Privacy: [https://booknoble.app/privacy]

- **Category:** Business (secondary: Productivity)
- **Age rating:** 4+ / Everyone. No objectionable content, no user-to-user public content.
- **Support URL:** [https://booknoble.app/support] · **Marketing URL:** [https://booknoble.app]
- **Privacy policy URL:** https://booknoble.app/privacy (served by the app's web build)
- **Account deletion URL (Play):** https://booknoble.app/delete-account

## Screenshots to capture

6.9" iPhone (1320×2868), 6.5" iPhone (1284×2778), iPad 13" if `supportsTablet` stays true, Android phone (1080×1920+). Suggested set, in order:
1. Dashboard (revenue card + next up). Caption: “Your business at a glance”
2. Calendar with open gaps. Caption: “Every open minute, bookable”
3. Customer booking page. Caption: “Clients book from one link”
4. Confirmation animation. Caption: “No double-bookings. Ever.”
5. Clients profile. Caption: “Know every client”
6. Invoices. Caption: “Get paid faster”
7. Insights (Pro). Caption: “Watch it grow”

Use the Settings → *Add sample appointments* tool on a test account so screenshots show fictional data only. Play **feature graphic**: `assets/store/play-feature-graphic.png` (1024×500).

## Apple App Privacy (“nutrition label”)

Tracking: **No**. Data is not used for third-party advertising, and no tracking SDKs are present.

| Data type | Collected | Linked to user | Purpose |
|---|---|---|---|
| Contact info: Name | Yes (customers' names entered by owners/customers) | Yes | App Functionality |
| Contact info: Email address | Yes | Yes | App Functionality |
| Contact info: Phone number | Yes | Yes | App Functionality |
| User content: Other user content (notes, services, invoices) | Yes | Yes | App Functionality |
| Identifiers: User ID | Yes (account id) | Yes | App Functionality |
| Diagnostics: Crash data | Only if you add a crash reporter (e.g. Sentry) | No | App Functionality |
| Financial info | **No.** Card data is entered on Stripe's page, not in the app | | |
| Purchases | Yes, once IAP is added (subscription status) | Yes | App Functionality |

`app.json` includes a matching iOS privacy manifest (`ios.privacyManifests`).

## Google Play Data safety

- Data collected: Personal info (name, email, phone), App activity (other user-generated content), App info & performance (crash logs, only if a crash reporter is added).
- Shared with third parties: **No** (service providers that process data on BookNoble's behalf are not “sharing” under Play's definition).
- Encrypted in transit: **Yes** (HTTPS/TLS to Supabase and Stripe).
- Users can request deletion: **Yes**, in-app and at https://booknoble.app/delete-account.
- Payment info: handled by Stripe and Google Play, not collected by the app.

## Permissions

BookNoble requests **no** runtime permissions (no camera, location, contacts or notifications prompts). `android.permissions` is empty, and unused permissions are blocked in `app.json`. If push notifications are added later, add a pre-prompt explaining “Get notified when a client books or cancels”.

## App Review notes (paste into App Store Connect)

```
BookNoble is a scheduling tool for service businesses.
Demo account: reviewer@booknoble.app / [password], a Pro test business with sample appointments.
Customer booking page (no login): https://booknoble.app/b/[demo-slug]
Customer deposits and invoices pay for real-world services performed outside the app (Guideline 3.1.3(e)) and use Stripe.
BookNoble software plans are sold with In-App Purchase.
Account deletion: More → Settings → Delete account.
```
