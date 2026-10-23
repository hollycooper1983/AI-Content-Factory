import { describe, expect, it } from "vitest";
import {
  canJoinGroup, canMessage, canPostAsOrganization, canPostOpportunity, canRequestConnection, canViewProfile,
  defaultVisibility, effectiveVisibility, searchable, type Actor,
} from "@/lib/permissions";

const minor = (id = "m1"): Actor => ({ id, role: "student", ageGroup: "minor", verified: false });
const adultStudent = (id = "a1"): Actor => ({ id, role: "student", ageGroup: "adult", verified: false });
const mentor = (verified: boolean, id = "mt"): Actor => ({ id, role: "mentor", ageGroup: "adult", verified });
const employer = (verified: boolean, id = "e1"): Actor => ({ id, role: "employer", ageGroup: "adult", verified });
const admin: Actor = { id: "adm", role: "admin", ageGroup: "adult", verified: true };
const ok = { blocked: false };

describe("profile visibility", () => {
  it("minors default to private and can never be public", () => {
    expect(defaultVisibility("minor")).toBe("private");
    expect(defaultVisibility("adult")).toBe("network");
    expect(effectiveVisibility(minor(), "public")).toBe("network");
    expect(effectiveVisibility(adultStudent(), "public")).toBe("public");
  });
  it("guests can't see a minor even if their stored visibility is public", () => {
    expect(canViewProfile(null, minor(), { visibility: "public" }, { connected: false, blocked: false })).toBe(false);
  });
  it("network profiles require a connection", () => {
    const owner = adultStudent("o");
    expect(canViewProfile(adultStudent("v"), owner, { visibility: "network" }, { connected: false, blocked: false })).toBe(false);
    expect(canViewProfile(adultStudent("v"), owner, { visibility: "network" }, { connected: true, blocked: false })).toBe(true);
  });
  it("blocking hides profiles, but owners and admins always see", () => {
    const owner = adultStudent("o");
    expect(canViewProfile(adultStudent("v"), owner, { visibility: "public" }, { connected: true, blocked: true })).toBe(false);
    expect(canViewProfile(owner, owner, { visibility: "private" }, { connected: false, blocked: false })).toBe(true);
    expect(canViewProfile(admin, owner, { visibility: "private" }, { connected: false, blocked: false })).toBe(true);
  });
  it("linked parents can view their student's profile", () => {
    const parent: Actor = { id: "p", role: "parent", ageGroup: "adult", verified: false };
    expect(canViewProfile(parent, minor(), { visibility: "private" }, { connected: false, blocked: false, isLinkedParent: true })).toBe(true);
  });
});

describe("connection requests", () => {
  it("adults can never initiate connections with minors", () => {
    expect(canRequestConnection(adultStudent(), minor(), ok).ok).toBe(false);
    expect(canRequestConnection(mentor(true), minor(), ok).ok).toBe(false);
    expect(canRequestConnection(employer(true), minor(), ok).ok).toBe(false);
  });
  it("minors can connect with minors and verified mentors only", () => {
    expect(canRequestConnection(minor("a"), minor("b"), ok).ok).toBe(true);
    expect(canRequestConnection(minor(), mentor(true), ok).ok).toBe(true);
    expect(canRequestConnection(minor(), mentor(false), ok).ok).toBe(false);
    expect(canRequestConnection(minor(), employer(true), ok).ok).toBe(false);
    expect(canRequestConnection(minor(), adultStudent(), ok).ok).toBe(false);
  });
  it("blocks, self-connections, suspended and admin accounts are rejected", () => {
    expect(canRequestConnection(adultStudent("a"), adultStudent("b"), { blocked: true }).ok).toBe(false);
    expect(canRequestConnection(adultStudent("a"), adultStudent("a"), ok).ok).toBe(false);
    expect(canRequestConnection({ ...adultStudent("a"), status: "suspended" }, adultStudent("b"), ok).ok).toBe(false);
    expect(canRequestConnection(adultStudent(), admin, ok).ok).toBe(false);
  });
  it("adults can connect with adults", () => {
    expect(canRequestConnection(adultStudent("a"), adultStudent("b"), ok).ok).toBe(true);
    expect(canRequestConnection(adultStudent(), employer(false), ok).ok).toBe(true);
  });
});

describe("messaging", () => {
  it("is disabled whenever a minor is involved", () => {
    expect(canMessage(minor("a"), minor("b"), { connected: true, blocked: false }).ok).toBe(false);
    expect(canMessage(mentor(true), minor(), { connected: true, blocked: false }).ok).toBe(false);
    expect(canMessage(minor(), mentor(true), { connected: true, blocked: false }).ok).toBe(false);
  });
  it("adults may message accepted, unblocked connections only", () => {
    expect(canMessage(adultStudent("a"), adultStudent("b"), { connected: true, blocked: false }).ok).toBe(true);
    expect(canMessage(adultStudent("a"), adultStudent("b"), { connected: false, blocked: false }).ok).toBe(false);
    expect(canMessage(adultStudent("a"), adultStudent("b"), { connected: true, blocked: true }).ok).toBe(false);
  });
});

describe("groups, organizations and search", () => {
  it("adults-only groups reject minors", () => {
    expect(canJoinGroup(minor(), { adultsOnly: true }).ok).toBe(false);
    expect(canJoinGroup(minor(), { adultsOnly: false }).ok).toBe(true);
  });
  it("only verified employers/colleges or admins post opportunities", () => {
    expect(canPostOpportunity(employer(false))).toBe(false);
    expect(canPostOpportunity(employer(true))).toBe(true);
    expect(canPostOpportunity(adultStudent())).toBe(false);
    expect(canPostOpportunity(admin)).toBe(true);
  });
  it("posting as an organization requires verified ownership", () => {
    expect(canPostAsOrganization(employer(true, "e1"), "e1")).toBe(true);
    expect(canPostAsOrganization(employer(false, "e1"), "e1")).toBe(false);
    expect(canPostAsOrganization(employer(true, "e1"), "someone-else")).toBe(false);
  });
  it("minors never appear in guest or unconnected adult searches", () => {
    const m = minor();
    expect(searchable(null, m, { visibility: "network" }, false)).toBe(false);
    expect(searchable(adultStudent(), m, { visibility: "network" }, false)).toBe(false);
    expect(searchable(minor("other"), m, { visibility: "network" }, false)).toBe(true);
    expect(searchable(minor("other"), m, { visibility: "private" }, false)).toBe(false);
  });
  it("private adults are hidden from strangers", () => {
    expect(searchable(adultStudent("v"), adultStudent("x"), { visibility: "private" }, false)).toBe(false);
    expect(searchable(null, adultStudent("x"), { visibility: "public" }, false)).toBe(true);
  });
});
