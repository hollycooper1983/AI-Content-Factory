import Link from "next/link";
import { requireRole } from "@/lib/auth";

const NAV = [["/admin", "Overview"], ["/admin/users", "Users & verification"], ["/admin/organizations", "Organizations"], ["/admin/colleges", "Colleges"], ["/admin/scholarships", "Scholarships"], ["/admin/jobs", "Job approvals"], ["/admin/groups", "Groups"], ["/admin/reports", "Reports"], ["/admin/settings", "Settings"]];

export const metadata = { robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[210px_minmax(0,1fr)]">
      <nav aria-label="Admin" className="card h-fit p-2 text-sm lg:sticky lg:top-20">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">Admin portal</p>
        {NAV.map(([h, l]) => <Link key={h} href={h} className="block rounded px-3 py-2 hover:bg-canvas">{l}</Link>)}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
