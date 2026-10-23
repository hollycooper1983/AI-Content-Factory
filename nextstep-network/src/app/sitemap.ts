import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const store = await db();
  const colleges = await store.all("colleges", { publishStatus: "published" });
  const pages = ["", "/about", "/how-it-works", "/colleges", "/scholarships", "/internships", "/jobs", "/careers", "/resources", "/signup", "/login"];
  return [...pages.map((p) => ({ url: base + p })), ...colleges.map((c) => ({ url: `${base}/colleges/${c.id}` }))];
}
