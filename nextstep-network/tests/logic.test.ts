import { describe, expect, it } from "vitest";
import { rankFeed, scorePost, FEED_LIMIT, type RankContext } from "@/lib/ranking";
import { fafsaPercent, profileCompletion, readinessScore, appPercent, FAFSA_STEPS } from "@/lib/progress";
import { checkScholarship } from "@/lib/scam-check";
import { gpa } from "@/lib/gpa";
import { aidBreakdown } from "@/lib/aid";
import { buildIcs } from "@/lib/ics";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import type { Post } from "@/lib/types";

const now = Date.parse("2026-10-23T12:00:00Z");
const post = (id: string, p: Partial<Post> = {}): Post => ({ id, createdAt: new Date(now - 3600e3).toISOString(), authorId: "x", body: "hello", category: "general", removed: false, ...p });
const ctx = (p: Partial<RankContext> = {}): RankContext => ({ viewerId: "me", connectionIds: new Set(), followedOrgIds: new Set(), interests: [], verifiedAuthorIds: new Set(), hiddenAuthorIds: new Set(), reportCounts: new Map(), now, ...p });

describe("feed ranking", () => {
  it("drops removed, blocked and heavily reported posts", () => {
    const out = rankFeed([post("a", { removed: true }), post("b", { authorId: "blocked" }), post("c"), post("d")], ctx({ hiddenAuthorIds: new Set(["blocked"]), reportCounts: new Map([["d", 3]]) }));
    expect(out.map((p) => p.id)).toEqual(["c"]);
  });
  it("boosts connections, followed organizations and interests", () => {
    const c = ctx({ connectionIds: new Set(["friend"]), followedOrgIds: new Set(["org"]), interests: ["biology"] });
    expect(scorePost(post("a", { authorId: "friend" }), c)).toBeGreaterThan(scorePost(post("b"), c));
    expect(scorePost(post("a", { orgId: "org" }), c)).toBeGreaterThan(scorePost(post("b"), c));
    expect(scorePost(post("a", { body: "Biology research tips" }), c)).toBeGreaterThan(scorePost(post("b"), c));
  });
  it("prefers fresher posts and caps feed length (no infinite scroll)", () => {
    const old = post("old", { createdAt: new Date(now - 10 * 864e5).toISOString() });
    expect(rankFeed([old, post("new")], ctx())[0].id).toBe("new");
    expect(rankFeed(Array.from({ length: 60 }, (_, i) => post(String(i))), ctx())).toHaveLength(FEED_LIMIT);
  });
});

describe("progress", () => {
  it("computes FAFSA and application percentages", () => {
    expect(fafsaPercent(null)).toBe(0);
    const steps = Object.fromEntries(FAFSA_STEPS.map((s) => [s.id, { done: true, note: "" }]));
    expect(fafsaPercent({ id: "f", createdAt: "", userId: "u", awardYear: "", steps })).toBe(100);
    expect(appPercent({ checklist: {} })).toBe(0);
  });
  it("profile completion lists missing fields", () => {
    const r = profileCompletion(null);
    expect(r.percent).toBe(0);
    expect(r.missing).toContain("Headline");
  });
  it("readiness score counts completed preparation tasks only", () => {
    const r = readinessScore({ profilePercent: 100, fafsaPercent: 100, savedColleges: 5, submittedApps: 1, scholarshipsTracked: 3, hasResume: true, residencyStarted: true });
    expect(r.score).toBe(100);
    expect(readinessScore({ profilePercent: 0, fafsaPercent: 0, savedColleges: 0, submittedApps: 0, scholarshipsTracked: 0, hasResume: false, residencyStarted: false }).score).toBe(0);
  });
});

describe("scholarship scam checker", () => {
  it("flags fees, guarantees and bank requests", () => {
    const r = checkScholarship("http://free-cash-scholarship.xyz", "Congratulations winner! Pay the $25 processing fee. Guaranteed award. Send your bank account number.");
    const text = r.findings.map((f) => f.message).join(" ");
    expect(r.findings.filter((f) => f.level === "warning").length).toBeGreaterThanOrEqual(3);
    expect(text).toMatch(/HTTPS/);
    expect(r.summary).toMatch(/serious warning signs/);
  });
  it("never guarantees legitimacy", () => {
    const r = checkScholarship("https://studentaid.gov/", "");
    expect(r.summary).toMatch(/can't confirm/);
  });
  it("handles invalid input", () => {
    expect(checkScholarship("not a url at all", "").findings[0].level).toBe("warning");
  });
});

describe("calculators", () => {
  it("GPA uses 4.0 scale with weighting and skips non-letter grades", () => {
    const g = gpa([{ grade: "A", credit: 1, level: "ap" }, { grade: "B", credit: 1, level: "standard" }, { grade: "P", credit: 1, level: "standard" }]);
    expect(g.unweighted).toBe(3.5);
    expect(g.weighted).toBe(4);
    expect(g.credits).toBe(2);
    expect(gpa([]).unweighted).toBeNull();
  });
  it("aid breakdown separates gifts from loans and work-study", () => {
    const b = aidBreakdown({ tuition: 10000, fees: 1000, housing: 9000, books: 1000, transportation: 1000, grants: 5000, scholarships: 2000, workStudy: 2000, loans: 5000 });
    expect(b).toEqual({ cost: 22000, gifts: 7000, net: 15000, gap: 8000, debt: 5000 });
  });
  it("ics export escapes text and produces all-day events", () => {
    const ics = buildIcs([{ uid: "1", title: "Apply, now; really", date: "2026-11-01" }, { uid: "2", title: "bad", date: "nope" }], new Date("2026-10-23T00:00:00Z"));
    expect(ics).toContain("DTSTART;VALUE=DATE:20261101");
    expect(ics).toContain("DTEND;VALUE=DATE:20261102");
    expect(ics).toContain("SUMMARY:Apply\\, now\; really");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });
});

describe("password hashing", () => {
  it("verifies correct passwords and rejects wrong ones", () => {
    const h = hashPassword("correct horse battery");
    expect(h).not.toContain("correct");
    expect(verifyPassword("correct horse battery", h)).toBe(true);
    expect(verifyPassword("wrong", h)).toBe(false);
    expect(verifyPassword("x", "garbage")).toBe(false);
  });
});
