import type { Metadata } from "next";
import { aiConfigured } from "@/lib/ai";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/queries";
import { Badge, Card, PageHeader } from "@/components/ui";
import { AnnouncementForm } from "./form";

export const metadata: Metadata = { title: "Admin · Settings" };

export default async function AdminSettings() {
  const store = await db();
  const announcement = (await getSetting("announcement")) ?? "";
  const rows: [string, boolean, string][] = [
    ["Database", store.kind === "supabase", store.kind === "supabase" ? "Supabase PostgreSQL" : "Local file store — development only"],
    ["AI Advisor (fal.ai)", aiConfigured(), aiConfigured() ? `Model: ${process.env.AI_MODEL || "openai/gpt-4o-mini"}, ${process.env.AI_DAILY_LIMIT || 20} requests/user/day` : "Set FAL_KEY to enable"],
    ["Email provider", false, "Not configured — email notifications and password reset are disabled"],
    ["File storage", false, "Not configured — profile photos use https URLs"],
    ["Demo mode", process.env.DEMO_MODE !== "false", process.env.DEMO_MODE === "false" ? "Off" : "On — demo banner and sign-in shortcuts visible"],
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="Site announcements & system settings" />
      <Card className="p-5"><h2 className="font-semibold">Site announcement banner</h2><p className="text-sm text-muted">Shown at the top of every page. Leave blank to hide.</p><AnnouncementForm value={announcement} /></Card>
      <Card className="p-5">
        <h2 className="font-semibold">Integrations</h2>
        <ul className="mt-2 divide-y divide-line text-sm">{rows.map(([k, ok, d]) => <li key={k} className="flex items-center justify-between gap-3 py-2"><span className="font-medium">{k}</span><span className="flex items-center gap-2 text-right text-muted">{d} <Badge tone={ok ? "green" : "amber"}>{ok ? "OK" : "Action needed"}</Badge></span></li>)}</ul>
        <p className="mt-3 text-xs text-muted">Environment variables are set in your hosting dashboard (e.g. Vercel → Project → Settings → Environment Variables). See README.</p>
      </Card>
    </div>
  );
}
