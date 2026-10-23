import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, BadgeCheck, FlaskConical, Info, ShieldQuestion } from "lucide-react";
import { cn, formatDate } from "@/lib/format";
import type { Verification } from "@/lib/types";

export function Card({ className, children, as: As = "section", id }: { className?: string; children: ReactNode; as?: "section" | "div" | "article" | "aside"; id?: string }) {
  return <As id={id} className={cn("card", className)}>{children}</As>;
}

export function CardHeader({ title, action, subtitle }: { title: ReactNode; action?: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const tones = {
  gray: "bg-canvas text-muted border-line",
  blue: "bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand/15 dark:text-blue-300 dark:border-brand/30",
  teal: "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal/15 dark:text-teal-300 dark:border-teal/30",
  green: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30",
  amber: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
  navy: "bg-navy text-white border-navy",
};
export type Tone = keyof typeof tones;

export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold", tones[tone], className)}>{children}</span>;
}

export function VerificationBadge({ v, showDate = true }: { v: Verification; showDate?: boolean }) {
  if (v.status === "verified")
    return <Badge tone="green"><BadgeCheck className="h-3 w-3" aria-hidden /> Verified{showDate && v.checkedAt ? ` ${formatDate(v.checkedAt)}` : ""}</Badge>;
  if (v.status === "demo") return <Badge tone="amber"><FlaskConical className="h-3 w-3" aria-hidden /> Demo data</Badge>;
  return <Badge tone="amber"><ShieldQuestion className="h-3 w-3" aria-hidden /> Unverified — confirm with official source</Badge>;
}

export function DemoBadge({ label = "Demo listing" }: { label?: string }) {
  return <Badge tone="amber"><FlaskConical className="h-3 w-3" aria-hidden /> {label}</Badge>;
}

export function OrgVerified({ verified }: { verified?: boolean }) {
  if (!verified) return null;
  return <BadgeCheck className="inline h-4 w-4 text-brand" aria-label="Verified organization" />;
}

export function PageHeader({ title, subtitle, action, eyebrow }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {icon && <div className="mb-3 rounded-full bg-brand-50 p-3 text-brand dark:bg-brand/15">{icon}</div>}
      <p className="font-semibold text-fg">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Progress({ value, tone = "brand", label }: { value: number; tone?: "brand" | "teal" | "green" | "amber"; label?: string }) {
  const color = { brand: "bg-brand", teal: "bg-teal", green: "bg-green-500", amber: "bg-amber-500" }[tone];
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-canvas" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Ring({ value, size = 64, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `${v}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="7" className="stroke-canvas" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="7" strokeLinecap="round" stroke="#14B8A6" strokeDasharray={c} strokeDashoffset={c - (c * v) / 100} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-fg text-[13px] font-bold">{v}%</text>
    </svg>
  );
}

export function Notice({ tone = "blue", children, title }: { tone?: "blue" | "amber" | "red" | "green"; children: ReactNode; title?: string }) {
  const Icon = tone === "amber" || tone === "red" ? AlertTriangle : Info;
  const cls = {
    blue: "border-brand-100 bg-brand-50 text-navy dark:border-brand/30 dark:bg-brand/10 dark:text-blue-100",
    amber: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
    red: "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100",
    green: "border-green-200 bg-green-50 text-green-900 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-100",
  }[tone];
  return (
    <div className={cn("flex gap-3 rounded-xl border p-3 text-sm", cls)} role={tone === "red" ? "alert" : "note"}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{title && <p className="font-semibold">{title}</p>}<div className={title ? "mt-0.5" : ""}>{children}</div></div>
    </div>
  );
}

export function ExternalLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={cn("link", className)}>{children}</a>;
}

export function Stat({ label, value, href, sub }: { label: string; value: ReactNode; href?: string; sub?: ReactNode }) {
  const inner = (
    <>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-fg">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </>
  );
  return href ? <Link href={href} className="card block p-4 transition hover:border-brand">{inner}</Link> : <div className="card p-4">{inner}</div>;
}

export function StatusPill({ status }: { status: string }) {
  const tone: Tone =
    ["accepted", "enrolled", "awarded", "offer", "approved", "published", "resolved", "verified"].includes(status) ? "green"
    : ["submitted", "under_review", "applied", "interviewing", "pending_review"].includes(status) ? "blue"
    : ["waitlisted", "pending", "preparing", "in_progress", "draft", "open"].includes(status) ? "amber"
    : ["declined", "not_awarded", "not_selected", "rejected", "suspended", "archived"].includes(status) ? "red"
    : "gray";
  const text = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return <Badge tone={tone}>{text}</Badge>;
}
