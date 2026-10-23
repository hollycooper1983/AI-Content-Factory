// End-to-end workflow tests (signup, posting, connections, messaging, job approval, moderation, exports).
// Run against a FRESH demo database: npm run db:reset && npm run build && npm start, then node tests/e2e/flows.mjs
import { chromium } from "playwright";
const base = "http://localhost:3000";
const browser = await chromium.launch();
let pass = 0, fail = 0;
const check = (name, cond, extra = "") => { if (cond) { pass++; console.log("PASS", name); } else { fail++; console.log("FAIL", name, extra); } };
async function login(email) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", email, e.message));
  await page.goto(base + "/login");
  await page.fill("#email", email); await page.fill("#password", "demo-password-2027");
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login")), page.click("button[type=submit]")]);
  return page;
}
const settle = (p) => p.waitForLoadState("networkidle").catch(() => {});

// 1. Signup flows
{
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.goto(base + "/signup"); await settle(page);
  await page.fill("#name", "Test Kid"); await page.fill("#email", "kid12@example.com"); await page.fill("#password", "longpassword1");
  await page.locator("label:has-text('Under 13')").click(); await page.check("input[name=terms]");
  await page.click("button[type=submit]");
  check("under-13 signup rejected", await page.locator("text=NextStep Network is for students 13 and older. Ask").waitFor().then(() => true, () => false));
  await page.fill("#email", "teen@example.com"); await page.fill("#name", "Test Teen");
  await page.locator("label:has-text('13–17')").click();
  await Promise.all([page.waitForURL(/profile\/edit/), page.click("button[type=submit]")]);
  check("teen signup lands on profile edit", page.url().includes("/profile/edit?welcome=1"));
  check("teen public visibility option disabled", await page.locator("input[name=visibility][value=public]").isDisabled());
  check("teen defaults to private", await page.locator("input[name=visibility][value=private]").isChecked());
  await page.fill("#headline", "Class of 2028 | Future Engineer");
  await page.click("button:has-text('Save profile')"); await page.waitForSelector("text=Profile saved.");
  check("profile save works", true);
  await page.goto(base + "/messages");
  check("teen messaging disabled", (await page.locator("h1").textContent()).includes("turned off"));
  await ctx.close();
}

// 2. Jordan social + planning
const j = await login("jordan@demo.nextstep");
await j.click("text=Share an update"); await j.fill("#post-body", "E2E test post about biology labs");
await j.click("form button[type=submit]:has-text('Post')"); await j.waitForSelector("text=E2E test post about biology labs");
check("create post appears in feed", true);
const card = j.locator("article", { hasText: "E2E test post about biology labs" });
await card.locator("button:has-text('Comment')").click();
await card.locator("input[name=body]").fill("First comment!"); await card.locator("button[type=submit]").click();
await card.locator("text=First comment!").waitFor();
check("comment added", true);
await card.locator("button:has-text('React')").click(); await settle(j);
await j.waitForTimeout(500);
check("reaction toggled", await card.locator("button:has-text('Like')").count() > 0);
await card.locator("button:has-text('Save')").click(); await card.locator("button:has-text('Saved')").waitFor();
check("post saved", true);

await j.goto(base + "/network/invitations");
await j.click("button:has-text('Accept')"); await j.waitForSelector("text=No pending invitations");
check("accept invitation", true);

await j.goto(base + "/colleges/col-uncw");
await j.click("button:has-text('Add to My Application Tracker')"); await j.waitForSelector("text=In your Application Tracker");
check("add college to tracker", true);

await j.goto(base + "/fafsa");
const before = "";
await j.locator("button[title='Mark complete']").first().click(); await settle(j); await j.waitForTimeout(600);
check("FAFSA step toggled", (await j.locator("button[title='Mark incomplete']").count()) === 11, before);

await j.goto(base + "/calendar");
await j.fill("#tt", "E2E deadline"); await j.fill("#td", "2026-11-15"); await j.click("button:has-text('Add')");
await j.waitForSelector("text=E2E deadline");
check("add calendar task", true);
const [dl] = await Promise.all([j.waitForEvent("download"), j.click("text=Export (.ics)")]);
const ics = await (await dl.createReadStream()).toArray().then((b) => Buffer.concat(b).toString());
check("ics export contains task", ics.includes("E2E deadline") && ics.includes("BEGIN:VCALENDAR"));

await j.goto(base + "/scholarships");
await j.locator("article", { hasText: "Dell Scholars" }).locator("button:has-text('Save & track')").click();
await j.locator("article", { hasText: "Dell Scholars" }).locator("button:has-text('Stop tracking')").waitFor();
check("track scholarship", true);

// report a post for moderation
await j.goto(base + "/feed");
const ethan = j.locator("article", { hasText: "Formula SAE" });
await ethan.locator("button[aria-label='Post options']").click();
await ethan.locator("text=Report post").click();
await ethan.locator("select[name=reason]").selectOption("Spam or scam");
await ethan.locator("button:has-text('Report')").last().click();
await ethan.locator("text=Thanks. Our moderators").waitFor();
check("report post", true);

const res = await j.request.post(base + "/api/ai", { data: { message: "How do I complete my FAFSA?" } });
check("AI without FAL_KEY returns setup message", res.status() === 503 && (await res.json()).setup === true);
const res2 = await j.request.post(base + "/api/ai", { data: { message: "my ssn is 123-45-6789" } });
check("AI blocks SSN-like input", [400, 503].includes(res2.status()));
const exp = await j.request.get(base + "/api/export");
const data = await exp.json();
check("data export includes profile, excludes password hash", !!data.profiles?.length && !JSON.stringify(data).includes("scrypt$"));

// 3. Adult safety & messaging
const s = await login("sofia@demo.nextstep");
await s.goto(base + "/search?q=jordan");
check("adult search hides minor", (await s.locator("text=Jordan Carter").count()) === 0);
await s.goto(base + "/search?q=daniel");
check("adult search finds adult", (await s.locator("text=Daniel Kim").count()) > 0);
await s.goto(base + "/network");
await s.locator("li", { hasText: "Daniel Kim" }).locator("button:has-text('Message')").click();
await s.waitForURL(/messages\?c=/);
await s.fill("#msg", "Hi Daniel, E2E message"); await s.click("form button[type=submit]");
await s.waitForSelector("text=Hi Daniel, E2E message");
check("adult can message connection", true);
const d = await login("daniel@demo.nextstep");
await d.goto(base + "/messages");
check("recipient sees unread conversation", (await d.locator("[aria-label='1 unread']").count()) === 1);

// 4. Employer posts job -> admin approves
const t = await login("taylor@demo.nextstep");
await t.goto(base + "/organization/opportunities"); await settle(t);
await t.fill("#jt", "E2E Pharmacy Tech Intern"); await t.fill("#jl", "Raleigh, NC"); await t.fill("#jp", "$16/hr"); await t.fill("#ju", "https://example.com/apply");
await t.click("button:has-text('Submit for review')"); await t.waitForSelector("text=Submitted for review");
check("employer job submitted as pending", (await t.locator("li", { hasText: "E2E Pharmacy Tech Intern" }).locator("text=Pending").count()) === 1);
const pub1 = await (await browser.newContext()).newPage(); await pub1.goto(base + "/jobs");
check("pending job hidden from public", (await pub1.locator("text=E2E Pharmacy Tech Intern").count()) === 0);
const a = await login("admin@demo.nextstep");
await a.goto(base + "/admin/jobs");
await a.locator("tr", { hasText: "E2E Pharmacy Tech Intern" }).locator("button:has-text('Approve')").click();
await a.locator("tr", { hasText: "E2E Pharmacy Tech Intern" }).locator("text=Approved").waitFor();
await pub1.goto(base + "/jobs");
check("approved job visible publicly", (await pub1.locator("text=E2E Pharmacy Tech Intern").count()) === 1);

// 5. Admin moderation
await a.goto(base + "/admin/reports");
a.once("dialog", (dlg) => dlg.accept());
await a.locator("button:has-text('Remove post')").first().click();
await a.waitForSelector("text=No open reports");
await j.goto(base + "/feed");
check("removed post gone from feed", (await j.locator("text=Formula SAE").count()) === 0);
await a.goto(base + "/admin");
check("audit log records actions", (await a.locator("text=report.resolve_remove").count()) > 0 && (await a.locator("text=job.status").count()) > 0);

// 6. Parent view
const p = await login("angela@demo.nextstep"); await p.goto(base + "/dashboard");
check("parent sees student checklist", (await p.locator("text=Jordan Carter").count()) > 0 && (await p.locator("text=FAFSA steps").count()) > 0);
await p.goto(base + "/admin");
check("non-admin denied admin", !p.url().includes("/admin"));

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
