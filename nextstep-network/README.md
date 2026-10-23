# NextStep Network

**Connect. Learn. Apply. Succeed.**: a professional social network and planning platform for high school students, college students, recent graduates, families, counselors, mentors, colleges and employers.

Built with Next.js 14 (App Router), React, TypeScript and Tailwind CSS. It runs on a built-in local database for development and on Supabase PostgreSQL in production. Images were generated with **fal.ai**, and the **NextStep AI Advisor** calls a language model through fal.ai.

---

## 1. Try it in 2 minutes

```bash
cd nextstep-network
npm install
npm run dev
```

Open http://localhost:3000. The first start creates a local database in `.data/db.json` and fills it with **clearly labeled fictional demo data**.

| Demo account | What you'll see |
|---|---|
| `jordan@demo.nextstep` | Jordan Carter, NC high school senior (Class of 2027, under 18). The main demo journey. |
| `sofia@demo.nextstep` | Adult community-college transfer student (messaging enabled) |
| `angela@demo.nextstep` | Parent with read-only access to Jordan's checklist |
| `taylor@demo.nextstep` | Verified employer (can post internships) |
| `admin@demo.nextstep` | Administrator portal |

Password for every demo account: `demo-password-2027`. Reset the demo data at any time with `npm run db:reset`.

### Using a Chromebook

1. **Settings → Advanced → Developers → Linux development environment → Turn on.**
2. Open the **Terminal** app and install Node.js 20:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs git
   ```
3. Clone your repository, then run the three commands above. Chrome on the Chromebook can open `http://localhost:3000`.

Prefer not to install anything? Open the repository on GitHub and choose **Code → Codespaces → Create codespace**, then run the same commands in its terminal.

---

## 2. Put it on the internet (Vercel + Supabase)

The local database is for development only. Vercel's servers can't save files, so production needs Supabase.

1. **Supabase**: create a project at https://supabase.com. Open **SQL Editor**, paste `supabase/migrations/0001_init.sql`, and click **Run**. Under **Project Settings → API**, copy the **Project URL** and the **service_role** key.
2. **Vercel**: import your GitHub repository at https://vercel.com/new and set **Root Directory** to `nextstep-network`.
3. In Vercel, open **Settings → Environment Variables** and add the variables from `.env.example`:

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | Yes (production) | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (production) | Server-only key. Never put it in client code or prefix it with `NEXT_PUBLIC_`. |
| `SITE_URL` | Recommended | Your public URL (used in the sitemap and SEO) |
| `DEMO_MODE` | Recommended | `false` for a real launch: no demo data is seeded and demo sign-in hints are hidden |
| `BOOTSTRAP_ADMIN_EMAIL` | For a real launch | The first account that signs up with this email becomes administrator (only while no admin exists) |
| `FAL_KEY` | Optional | Turns on the AI Advisor (https://fal.ai/dashboard/keys) |
| `AI_MODEL` | Optional | Model used through fal.ai (default `openai/gpt-4o-mini`) |
| `AI_DAILY_LIMIT` | Optional | AI requests per user per day (default 20) |
| `NEXT_PUBLIC_LOCAL_IMAGES` | Optional | `true` serves images from `public/images` (see below) |

4. Deploy. With `DEMO_MODE=true` (the default), an empty Supabase database is seeded with the same demo data.

### Images (fal.ai)

The hero photos, banner and fictional headshots were generated with fal.ai (Nano Banana 2 and FLUX.1 [schnell]) and load from fal's CDN. If an image ever fails to load, the site shows a branded gradient or initials instead. To host your own copies, run:

```bash
node scripts/fetch-images.mjs      # downloads into public/images
```

Then set `NEXT_PUBLIC_LOCAL_IMAGES=true`.

---

## 3. Implementation checklist

**✅ Completed and tested** (unit tests in `tests/` plus end-to-end runs of `tests/e2e/` against a production build)

- Responsive navigation: desktop top bar with all 7 sections, the "Me" menu and the "More" menu; mobile bottom bar (Home · Network · Opportunities · Messages · Profile); light/dark theme
- Signup and login for every role, with age ranges (under-13 blocked; minors must be students), scrypt password hashing, httpOnly session cookies, rate limits and middleware redirects for signed-out visitors
- **The four first-deliverable pages:** public homepage, three-column social feed, professional profile, Student Command Center
- Social feed: posts (text, links, images), reactions, comments, reposts, saves, reporting, feed filters, transparent ranking with a capped feed ("You're all caught up")
- My Network: connections, invitations (accept/ignore), suggestions by school, field and target college, follow organizations
- Groups: public and private (request to join), admin approval, rules, resources, group feeds, moderation
- Messaging between adult connections, with block and report. **Turned off for members under 18** (see Safety).
- Notifications that reflect real activity, with category, frequency and email preferences
- College Finder: filters, detail pages, compare up to 4 side by side, save, follow, add to the tracker
- College Application Center: board and list views, sorting and filters, 9 statuses, checklists, private confirmation numbers; essay tool with version history, copy/download and AI feedback; course organizer with GPA estimate
- FAFSA Command Center (13 steps, notes that reject SSN-like numbers, official links only) and Financial Aid Comparison (gifts, earnings and debt separated; cost/gap chart)
- NC Residency & Free Application resources, with private residency-status tracking
- Scholarships: search, filters, compare, track (Saved/Preparing/Submitted/Awarded/Not Awarded), reminder tasks, Scam Awareness Center and checker
- Internships & Jobs: categories, filters, detail pages, tracker, reporting; employer posting goes to admin approval before going live
- Calendar: month view, events, deadlines and tasks, `.ics` export
- Parent dashboard through a one-time link code the student controls and can revoke
- Organization pages and organization dashboard
- Admin portal: users and verification, suspension, organizations, college editing with source and verification, scholarship workflow (Draft → Pending Review → Approved → Published → Archived), job approvals, group moderation, report resolution, site announcement, integration status, audit log
- Global search with categories and authorization (minors never appear to adults or guests)
- Settings: privacy, password change, blocked members, JSON data export, account deletion
- Permission rules for youth safety (16 unit tests)

**🟡 Implemented but untested**

- Supabase adapter (`src/lib/db/supabase.ts`) and SQL schema. They follow the same interface as the tested local store, but haven't been run against a live Supabase project. Test them before launch.
- AI Advisor and AI writing help with a real `FAL_KEY` (the no-key setup message and the sensitive-data block are tested)
- Resume builder, transfer planner, career tools, academic calculators: they work in the browser and save to the database, but are covered only by smoke tests

**🧪 Demonstration only**

- All people, employers, posts, events and job listings are fictional and labeled "Demo"
- Colleges and scholarships are **real institutions and programs** with official links, but costs, deadlines and award details are left blank or marked **Unverified** until an admin confirms them
- Career wages are BLS national medians (May 2023) and outlook (2023–33). Check bls.gov/ooh for newer releases.

**🔌 Requires external integration**

- Email delivery (password reset, email notifications, digests): add a provider such as Resend or Postmark
- Photo uploads: profile photos currently take https URLs; add Supabase Storage for uploads
- Live job feeds and College Scorecard sync
- Multi-server rate limiting: the current limiter is in-memory per server; use Redis or a database table at scale

**⬜ Not yet built (later phases)**

- Supervised youth messaging (guardian visibility and moderation queue)
- Mentor Match and College Buddy matching
- Scholarship and internship matching algorithms
- Expanded nationwide college data, institutional subscriptions and authorized application integrations
- Supabase Auth: the app uses its own secure sessions for portability between the local and Supabase databases

---

## 4. Safety & privacy design

- Students under 18: profile is private by default and can never be public; hidden from adults' and guests' search; adults can't send them connection requests; they can connect only with other minors and **verified** mentors and counselors; direct messaging is off.
- Employers, colleges, mentors and counselors need admin verification before they get elevated privileges.
- Every post, comment, listing, profile and conversation can be reported or blocked. Posts with 3 or more open reports are held out of feeds automatically.
- Data minimization: only an age range is collected (no birth date, SSN or address). The FAFSA and residency pages never ask for SSNs, FSA IDs or residency certificate numbers, and notes that look like SSNs are rejected.
- Data export and account deletion are in Settings. Private planning data never appears on profiles or to employers.
- Supabase row-level security is enabled on every table with no public policies, so the anon key can't read anything directly.

> **Legal review needed before a public launch.** Have qualified counsel review COPPA, FERPA (where applicable), state student privacy laws and child online safety obligations. These technical safeguards alone don't make the site legally compliant.

---

## 5. Costs (as of late 2026; confirm current pricing)

| Service | Free tier | When costs start |
|---|---|---|
| Vercel hosting | Hobby plan, for personal/non-commercial use | A commercial launch needs the Pro plan (about $20 per team member per month) plus usage |
| Supabase database | Free projects have limited storage and pause after inactivity | Pro plan (about $25/month) for production reliability, backups and more storage |
| fal.ai AI Advisor | Pay as you go | Each request costs a fraction of a cent to a few cents depending on `AI_MODEL`. Limit it with `AI_DAILY_LIMIT`, and set a spending cap in your fal.ai dashboard. |
| fal.ai images | Pay as you go | Already generated. The images on this site cost under $0.50 in total (FLUX.1 schnell at about $0.003 per megapixel; Nano Banana 2 at about $0.08 per image). |
| Email (future) | Most providers have a small free tier | Costs grow with volume |
| Moderation | Built-in tools are free | Human moderation time grows with the community |

None of these services stays free at scale. The app is built so you can add each one when you need it.

---

## 6. Developer reference

```
src/app/            Pages (App Router), server actions in src/app/actions, API routes in src/app/api
src/components/     Shared UI (navigation, post card, composer, sidebars, AI advisor)
src/lib/            Data model, database adapters, auth, permissions, ranking, progress, seed data
supabase/           SQL migrations
tests/              Unit tests (vitest) and end-to-end scripts (tests/e2e)
```

```bash
npm run typecheck   # TypeScript
npm test            # unit tests
npm run build       # production build
# End-to-end (optional): npm i -D playwright && npx playwright install chromium
npm run db:reset && npm run build && npm start   # in one terminal
npm run test:e2e                                 # in another
```
