// End-to-end smoke test: visits every route as guest, student, adult student, parent, employer and admin.
// Requires a running server on :3000 with a fresh demo database and the `playwright` package.
import { chromium } from "playwright";
const base = "http://localhost:3000";
const browser = await chromium.launch();
const errors = [];
async function session(email) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${email} PAGEERROR ${page.url()} ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/fal\.media|Failed to load resource/.test(m.text())) errors.push(`${email} CONSOLE ${page.url()} ${m.text().slice(0, 200)}`); });
  if (email) {
    await page.goto(base + "/login");
    await page.fill("#email", email); await page.fill("#password", "demo-password-2027");
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login")), page.click("button[type=submit]")]);
  }
  return page;
}
async function visit(page, who, paths) {
  for (const p of paths) {
    const r = await page.goto(base + p, { waitUntil: "domcontentloaded" });
    const status = r.status();
    const final = new URL(page.url()).pathname;
    const h = await page.locator("h1").first().textContent({ timeout: 3000 }).catch(() => "(no h1)");
    console.log(`${who.padEnd(8)} ${String(status)} ${p.padEnd(30)} -> ${final.padEnd(22)} ${String(h).trim().slice(0, 50)}`);
    if (status >= 500) errors.push(`${who} ${p} ${status}`);
  }
}
const publicPaths = ["/", "/about", "/how-it-works", "/colleges", "/colleges/col-jcc", "/colleges/compare?ids=col-jcc,col-ecu,col-ncat,col-asuonline", "/scholarships", "/internships", "/jobs", "/jobs/job-1", "/careers", "/careers?c=registered-nurse&compare=registered-nurse,microbiologist", "/resources", "/login", "/signup", "/organizations", "/organizations/org-carolina-health", "/help", "/residency", "/search?q=biology", "/feed", "/admin", "/profile/u-jordan", "/robots.txt", "/sitemap.xml"];
const appPaths = ["/feed", "/feed?tab=funding", "/profile", "/profile/edit", "/profile/preview", "/profile/u-sofia", "/network", "/network/invitations", "/groups", "/groups/grp-transfer", "/groups/grp-firstgen", "/messages", "/notifications", "/dashboard", "/dashboard/summary", "/my-colleges", "/applications", "/applications?view=list&sort=progress", "/applications/essays", "/applications/courses", "/financial-aid", "/fafsa", "/residency", "/my-scholarships", "/my-jobs", "/resume-builder", "/career-planner", "/transfer-planner", "/calendar", "/settings", "/saved", "/opportunities", "/search?q=nurse", "/organization/dashboard", "/admin"];
const adminPaths = ["/admin", "/admin/users", "/admin/organizations", "/admin/colleges?id=col-jcc", "/admin/scholarships?id=sch-gates", "/admin/jobs", "/admin/groups", "/admin/reports", "/admin/settings"];
await visit(await session(null), "guest", publicPaths);
const jordan = await session("jordan@demo.nextstep");
await visit(jordan, "jordan", appPaths);
await visit(await session("sofia@demo.nextstep"), "sofia", ["/messages", "/profile/u-jordan", "/search?q=jordan", "/network"]);
await visit(await session("angela@demo.nextstep"), "parent", ["/dashboard", "/feed"]);
await visit(await session("taylor@demo.nextstep"), "employer", ["/dashboard", "/organization/dashboard", "/organization/opportunities", "/profile/u-jordan"]);
await visit(await session("admin@demo.nextstep"), "admin", adminPaths);
console.log("\nERRORS:", errors.length ? "\n" + errors.join("\n") : "none");
await browser.close();
