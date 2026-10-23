import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.SITE_URL || "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: ["/", "/about", "/how-it-works", "/colleges", "/scholarships", "/internships", "/jobs", "/careers", "/resources"], disallow: ["/admin", "/api", "/profile", "/messages", "/settings", "/dashboard", "/search"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
