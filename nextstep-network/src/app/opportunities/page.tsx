import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, GraduationCap, Map, Trophy, FileText, Compass } from "lucide-react";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Opportunities" };

export default function Opportunities() {
  const items = [
    { href: "/colleges", icon: GraduationCap, t: "Colleges", d: "Find and compare colleges" },
    { href: "/scholarships", icon: Trophy, t: "Scholarships", d: "Real scholarships with official links" },
    { href: "/internships", icon: Briefcase, t: "Internships", d: "Paid and labeled unpaid internships" },
    { href: "/jobs", icon: Briefcase, t: "Jobs", d: "Student and entry-level jobs" },
    { href: "/careers", icon: Compass, t: "Careers", d: "Explore careers and salaries" },
    { href: "/fafsa", icon: FileText, t: "FAFSA", d: "Step-by-step financial aid checklist" },
    { href: "/transfer-planner", icon: Map, t: "Transfer Planner", d: "Community college to bachelor's" },
    { href: "/residency", icon: Map, t: "NC Residency", d: "Residency & free applications" },
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <PageHeader title="Opportunities" />
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(({ href, icon: I, t, d }) => <Link key={href} href={href} className="card flex items-center gap-3 p-4 hover:border-brand"><I className="h-6 w-6 text-brand" /><span><span className="block font-semibold">{t}</span><span className="text-sm text-muted">{d}</span></span></Link>)}
      </div>
    </div>
  );
}
