# Setup guide

Written for a Chromebook with only a browser. Every step uses a web dashboard or a cloud terminal; nothing needs installing on the Chromebook itself.

## 1. Open the code in a cloud terminal

**GitHub Codespaces** (recommended, free monthly hours):
1. Open the repository on github.com → green **Code** button → **Codespaces** → **Create codespace on main**.
2. A VS Code editor opens in your browser with a terminal at the bottom.
3. Run:
   ```bash
   cd booknoble
   npm install
   npm run web
   ```
4. Codespaces shows a pop-up “Open in Browser” for port 8081. That tab is BookNoble, running in **demo mode**.

**Try it on your phone:** install **Expo Go** from the App Store / Play Store, then run `npx expo start --tunnel` in the Codespace and scan the QR code. (Expo Go supports everything BookNoble uses today; in-app purchases will later require a development build.)

> Alternative: if you enable Linux on the Chromebook (Settings → Advanced → Developers → Linux), the same commands work locally.

## 2. Create the Supabase backend (live mode)

1. Sign up at [supabase.com](https://supabase.com) → **New project** (choose a strong database password, region near your customers).
2. **SQL Editor** → paste the contents of `supabase/migrations/20261025000000_init.sql` → **Run**.
3. **Authentication → Providers → Email**: keep enabled; turn on *Confirm email*.
   **Authentication → URL Configuration**: set Site URL to your web address (step 5).
4. **Project Settings → API**: copy the *Project URL* and *anon public* key.
5. In the Codespace, create `booknoble/.env.local`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   EXPO_PUBLIC_WEB_URL=https://your-booking-domain
   ```
   Restart `npm run web`. The demo-mode banners disappear and accounts become real.

The anon key is designed to be public; Row Level Security is what protects data. **Never** put the `service_role` key, Stripe secret key or fal.ai key in the app or in `.env.local`.

## 3. Deploy the Edge Functions

In the Codespace (the Supabase CLI runs via npx):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase functions deploy delete-account
npx supabase functions deploy payments
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy send-reminders --no-verify-jwt
npx supabase functions deploy revenuecat-webhook --no-verify-jwt
npx supabase functions deploy generate-asset
```

Set secrets in **Project Settings → Edge Functions → Secrets** (or `npx supabase secrets set NAME=value`):

| Secret | Used by | Value |
|---|---|---|
| `PUBLIC_WEB_URL` | payments, reminders | `https://your-booking-domain` |
| `STRIPE_SECRET_KEY` | payments | Stripe → Developers → API keys (use test key first) |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | from the Connect webhook you create below |
| `CRON_SECRET` | send-reminders | any long random string |
| `RESEND_API_KEY`, `REMINDER_FROM_EMAIL` | send-reminders (email) | [resend.com](https://resend.com), verified sender domain |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | send-reminders (SMS) | Twilio console; US numbers need A2P 10DLC registration |
| `REVENUECAT_WEBHOOK_AUTH` | revenuecat-webhook | the Authorization header value you set in RevenueCat |
| `FAL_KEY` | generate-asset | fal.ai dashboard → API keys |
| `ADMIN_EMAILS` | generate-asset | staff emails allowed to generate brand assets |

## 4. Reminders schedule

Supabase → **Integrations → Cron** → new job every 15 minutes (`*/15 * * * *`) → type *HTTP request* → POST `https://<project>.supabase.co/functions/v1/send-reminders` with header `x-cron-secret: <CRON_SECRET>`.

## 5. Host the customer booking pages

```bash
npm run build:web   # outputs dist/
```

Deploy `dist/` to any static host with single-page-app fallback:
- **EAS Hosting**: `npx eas-cli@latest deploy`
- **Netlify / Vercel / Cloudflare Pages**: connect the GitHub repo, build command `cd booknoble && npm install && npm run build:web`, output `booknoble/dist`, and add a rewrite of `/*` → `/index.html`.

Point your domain (e.g. `booknoble.app`) at it and set `EXPO_PUBLIC_WEB_URL` to match. For app links, host `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` (Expo docs: “Universal links” / “Android App Links”).

## 6. Payments (customer deposits and invoices)

1. Create a [Stripe](https://stripe.com) account and enable **Connect** (Express accounts).
2. Stripe → Developers → Webhooks → **Add endpoint** → *Listen to events on Connected accounts* → URL `https://<project>.supabase.co/functions/v1/stripe-webhook` → event `checkout.session.completed`. Copy its signing secret to `STRIPE_WEBHOOK_SECRET`.
3. In the app: More → Settings → **Connect Stripe**, finish onboarding, then turn on **Collect deposits**.

Funds go straight to each business's own Stripe account. BookNoble does not hold balances or move money between users.

## 7. Builds with EAS (cloud, no Mac required)

```bash
npx eas-cli@latest login
npx eas-cli@latest init                    # writes the real projectId into app.json
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://xxxx.supabase.co --environment production --visibility plaintext
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJ... --environment production --visibility plaintext
npx eas-cli@latest env:create --name EXPO_PUBLIC_WEB_URL --value https://booknoble.app --environment production --visibility plaintext
npx eas-cli@latest build --platform android --profile preview      # installable APK for testing
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios      # → TestFlight
npx eas-cli@latest submit --platform android  # → Play internal testing track (draft)
```

Prerequisites: Apple Developer Program ($99/yr), Google Play Console ($25 one-time), and the app records created in App Store Connect / Play Console (bundle id / package `app.booknoble.mobile`; change it in `app.json` if you prefer another). EAS manages signing credentials for you.

## 8. Generating more brand assets

From the app's staff account, call the `generate-asset` function (Supabase dashboard → Edge Functions → *Invoke*, or `curl` with your session token) with `{ "prompt": "...", "aspect_ratio": "4:5", "name": "spa" }`. The fal.ai key stays on the server, outputs are copied into the `brand-assets` storage bucket (create it as public first), and the model is Bria FIBO 2, which is trained on licensed data.
