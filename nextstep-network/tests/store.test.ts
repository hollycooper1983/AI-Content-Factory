import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LocalStore } from "@/lib/db/local";
import { seed } from "@/lib/seed";

describe("LocalStore", () => {
  it("supports CRUD with equality filters and persists to disk", async () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ns-")), "db.json");
    const s = new LocalStore(file);
    const t = await s.insert("tasks", { userId: "u1", title: "A", date: null, kind: "personal", done: false });
    await s.insert("tasks", { userId: "u2", title: "B", date: null, kind: "personal", done: false });
    expect((await s.all("tasks", { userId: "u1" })).map((x) => x.title)).toEqual(["A"]);
    await s.update("tasks", t.id, { done: true, id: "hacked" } as never);
    expect((await s.get("tasks", t.id))?.done).toBe(true);
    const reloaded = new LocalStore(file);
    expect(await reloaded.all("tasks")).toHaveLength(2);
    expect(await reloaded.remove("tasks", { userId: "u2" })).toBe(1);
    expect(await reloaded.all("tasks")).toHaveLength(1);
  });
  it("returns copies so callers can't mutate stored rows", async () => {
    const s = new LocalStore(null);
    const t = await s.insert("tasks", { userId: "u", title: "A", date: null, kind: "personal", done: false });
    (await s.get("tasks", t.id))!.title = "changed";
    expect((await s.get("tasks", t.id))!.title).toBe("A");
  });
});

describe("demo seed data integrity", () => {
  it("labels fictional content and never marks starter data verified", async () => {
    const s = new LocalStore(null);
    await seed(s);
    const users = await s.all("users");
    expect(users.every((u) => u.isDemo)).toBe(true);
    expect((await s.all("jobs")).every((j) => j.isDemo && j.url === null)).toBe(true);
    for (const sch of await s.all("scholarships")) {
      expect(sch.url).toMatch(/^https:\/\//);
      expect(sch.verification.status).not.toBe("verified");
      expect(sch.deadline).toBeNull();
    }
    for (const c of await s.all("colleges")) {
      expect(c.website).toMatch(/^https:\/\//);
      expect(c.verification.status).not.toBe("verified");
    }
    const profiles = await s.all("profiles");
    for (const u of users.filter((x) => x.ageGroup === "minor")) {
      expect(profiles.find((p) => p.userId === u.id)?.visibility).not.toBe("public");
      expect(u.role).toBe("student");
    }
    // No adult is connected to a minor except verified mentors/counselors.
    const byId = new Map(users.map((u) => [u.id, u]));
    for (const c of (await s.all("connections")).filter((x) => x.status === "accepted")) {
      const [a, b] = [byId.get(c.requesterId)!, byId.get(c.addresseeId)!];
      if (a.ageGroup !== b.ageGroup) {
        const adult = a.ageGroup === "adult" ? a : b;
        expect(adult.verified && ["mentor", "counselor"].includes(adult.role)).toBe(true);
      }
    }
  });
});
