# Billing policy and approach

Two separate money flows. Keep them separate in code, copy and accounting.

| Flow | Who pays whom | What it is | How |
|---|---|---|---|
| **BookNoble subscription** | Business → BookNoble | Digital service (software features) | Apple In-App Purchase / Google Play Billing in the mobile apps; Stripe Billing on the web |
| **Customer payments** | Customer → Business | Real-world services (haircut, detailing, event setup) | Stripe Connect Checkout on the business's own Stripe account |

## Policy summary (checked October 2026; re-verify before submitting)

**Apple**
- Guideline 3.1.1: digital features and subscriptions unlocked *inside* the app must be sold with In-App Purchase.
- On the **US storefront**, since the 2025 Epic v. Apple ruling, apps may include buttons/links to purchase on the web without an entitlement (guideline 3.1.1(a)/3.1.3 updates). Outside the US, link-outs need a region-specific entitlement or are not allowed.
- Guideline 3.1.3(e): goods and services consumed **outside the app** (physical services) must use payment methods other than IAP. BookNoble's customer deposits and invoices fall here, so Stripe is correct and IAP must not be used.
- Auto-renewable subscriptions must show the title, length, price, renewal terms and links to the Terms and Privacy Policy before purchase, and offer a way to manage or cancel. These are on the Subscription screen.
- Guideline 5.1.1(v): apps with account creation must let users delete their account in-app. This is implemented (Settings → Delete account → `delete-account` function).

**Google Play**
- Digital subscriptions use Google Play Billing by default.
- In the **US**, Google runs *alternative billing* and *external content links* programs. Per Google's Play Console Help notice, enrolled developers report transactions and pay service fees (reporting from October 1, 2026; the external-links deadline moved to December 1, 2026), and a revised Epic settlement was announced March 4, 2026, with details still pending. Fees and dates are changing: read the current Play Console page before enrolling.
- Payments for physical services are exempt from Play Billing, so Stripe is correct for customer payments.
- Apps that allow account creation must offer in-app deletion **and** a web deletion link. BookNoble hosts `/delete-account` for this.

Sources:
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Michael Tsai: App Review Guidelines updated for Epic anti-steering](https://mjtsai.com/blog/2025/05/02/app-review-guidelines-updated-for-epic-anti-steering/)
- [Google Play Console Help: policies for developers serving users in the US](https://support.google.com/googleplay/android-developer/answer/15582165?hl=en)
- [Android Developers Blog: Expanded billing choice and lower fees on Google Play (June 2026)](https://android-developers.googleblog.com/2026/06/play-expanded-billing.html)

## Recommended implementation

1. **Mobile (all regions): IAP through RevenueCat.**
   - Create products `booknoble_starter_monthly` ($9.99) and `booknoble_pro_monthly` ($19.99) in App Store Connect and Play Console, in one subscription group.
   - In RevenueCat, create entitlements `starter` and `pro` and attach the products.
   - Add `react-native-purchases` with `npx expo install react-native-purchases` (requires an EAS development build; it is not in Expo Go). Call `Purchases.configure` with `EXPO_PUBLIC_REVENUECAT_*_KEY` and `Purchases.logIn(<supabase user id>)`, then wire `purchasePackage` / `restorePurchases` into `src/app/(owner)/subscription.tsx` where `billingStatus().kind === 'store'`.
   - Point RevenueCat's webhook at the `revenuecat-webhook` function. It is the only thing that updates `businesses.plan` (owners cannot change it themselves; the database denies it).
2. **Web: Stripe Billing.** Set `EXPO_PUBLIC_STRIPE_BILLING_URL` to a Stripe payment link or customer portal; add a Stripe Billing webhook that updates `plan` the same way.
3. **US link-out (optional, later).** If you want to point US iOS users to web pricing, gate the link by StoreKit storefront country and follow Apple's current US rules. Do not show it elsewhere.

Do not assume Stripe can replace store billing for subscriptions sold inside the app.
