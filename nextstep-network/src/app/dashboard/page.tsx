import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Briefcase, CalendarClock, CheckCircle2, Circle, ClipboardList, Compass, Download, FileText, GraduationCap, Trophy, User, Users } from "lucide-react";
import { toggleTask } from "@/app/actions/planning";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { nextActions, studentSummary } from "@/lib/dashboard";
import { daysUntil, formatDate, label } from "@/lib/format";
import { ActionButton } from "@/components/client-ui";
import { Badge, Card, CardHeader, EmptyState, Notice, PageHeader, Progress, Ring, StatusPill } from "@/components/ui";
import { NotesBox } from "./notes";
import { ParentDashboard } from "./parent";

export const metadata: Metadata = { title: "Student Command Center" };

export default async function Dashboard() {
  const user = await requireUser();
  if (user.role === "admin") redirect("/admin");
  if (user.role === "employer" || user.role === "college") redirect("/organization/dashboard");
  if (user.role === "parent") return <ParentDashboard parentId={user.id} />;
  if (user.role === "mentor" || user.role === "counselor") return <ProDashboard name={user.name} verified={user.verified} />;

  const s = await studentSummary(user.id);
  const store = await db();
  const notes = await store.find("user_docs", { userId: user.id, kind: "notes" });
  const actions = nextActions(s);
  const grad = s.profile?.gradYear;
  const gradDays = grad ? daysUntil(`${grad}-06-10`) : null;
  const res = s.profile?.residencyStatus ?? "not_started";
  const fafsaSubmitted = !!s.fafsa?.steps.submit?.done;

  const timeline = [
    { label: "Build college list", done: s.savedColleges >= 3 },
    { label: "Submit applications", done: s.submitted > 0 },
    { label: "Submit FAFSA", done: fafsaSubmitted },
    { label: "Residency determination", done: res.startsWith("determined") },
    { label: "Compare aid offers", done: !!s.fafsa?.steps.compare?.done },
    { label: `High school graduation${grad ? ` (${grad})` : ""}`, done: !!gradDays && gradDays < 0 },
    { label: "Enrollment deposit & orientation", done: s.apps.some((a) => a.status === "enrolled") },
    { label: "First semester", done: false },
  ];
  const firstOpen = timeline.findIndex((t) => !t.done);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader
        eyebrow="Student Command Center"
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        subtitle={[s.profile?.school, grad ? `Class of ${grad}` : null, s.profile?.careerInterests.slice(0, 3).join(" · ")].filter(Boolean).join(" · ")}
        action={<><Link href="/dashboard/summary" className="btn-secondary"><Download className="h-4 w-4" /> Planning summary</Link><Link href="/calendar" className="btn-primary"><CalendarClock className="h-4 w-4" /> Deadlines</Link></>}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
            <Ring value={s.readiness.score} size={96} label={`College readiness ${s.readiness.score}%`} />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">College Readiness Score</h2>
              <p className="text-sm text-muted">Shows how many recommended preparation steps you've completed. It is not an admissions prediction and it doesn't measure your ability or worth.</p>
              <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                {s.readiness.items.map((i) => (
                  <li key={i.label} className="flex items-center gap-2">{i.done ? <CheckCircle2 className="h-4 w-4 text-teal" /> : <Circle className="h-4 w-4 text-muted" />}<span className={i.done ? "text-fg" : "text-muted"}>{i.label}</span></li>
                ))}
              </ul>
            </div>
            {gradDays != null && gradDays > 0 && (
              <div className="rounded-xl bg-navy p-4 text-center text-white">
                <p className="text-3xl font-extrabold">{gradDays}</p>
                <p className="text-xs text-blue-100">days until graduation<br />(estimated June {grad})</p>
              </div>
            )}
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryTile icon={<GraduationCap className="h-5 w-5" />} title="My College Journey" href="/applications" value={`${s.submitted}/${s.apps.length}`} sub="applications submitted" pct={s.apps.length ? (s.submitted / s.apps.length) * 100 : 0} />
            <SummaryTile icon={<FileText className="h-5 w-5" />} title="My FAFSA" href="/fafsa" value={fafsaSubmitted ? "Submitted" : `${s.fPct}%`} sub={`${s.fPct}% of checklist`} pct={s.fPct} tone="teal" />
            <SummaryTile icon={<Trophy className="h-5 w-5" />} title="Scholarships" href="/my-scholarships" value={String(s.schApps.length)} sub={`${s.schApps.filter((x) => x.status === "submitted").length} submitted`} pct={s.schApps.length ? (s.schApps.filter((x) => ["submitted", "awarded"].includes(x.status)).length / s.schApps.length) * 100 : 0} tone="green" />
            <SummaryTile icon={<User className="h-5 w-5" />} title="My Profile" href="/profile/edit" value={`${s.prof.percent}%`} sub="profile complete" pct={s.prof.percent} tone="amber" />
          </div>

          <Card>
            <CardHeader title="Suggested next actions" subtitle="Based on your saved progress" />
            {actions.length === 0 ? <EmptyState title="You're on track!" body="Nothing urgent right now." /> : (
              <ul className="divide-y divide-line">
                {actions.map((a) => (
                  <li key={a.label}><Link href={a.href} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-canvas"><span className="font-medium">{a.label}</span><ArrowRight className="h-4 w-4 shrink-0 text-brand" /></Link></li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="My College Journey" action={<Link href="/applications" className="text-sm font-semibold text-brand hover:underline">Open Application Center</Link>} />
            {s.apps.length === 0 ? <EmptyState icon={<GraduationCap className="h-5 w-5" />} title="No colleges tracked yet" action={<Link href="/colleges" className="btn-primary">Find colleges</Link>} /> : (
              <ul className="divide-y divide-line">
                {s.apps.map((a) => (
                  <li key={a.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_140px_130px] sm:items-center">
                    <div><Link href={`/colleges/${a.collegeId}`} className="font-semibold hover:text-brand">{a.college?.name}</Link><p className="text-xs text-muted">{a.appType}{a.deadline ? ` · Deadline ${formatDate(a.deadline)}` : ""}</p></div>
                    <div><Progress value={a.pct} label="Checklist" /><p className="mt-1 text-xs text-muted">{a.pct}% of checklist</p></div>
                    <div className="sm:text-right"><StatusPill status={a.status} /></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader title="My FAFSA" action={<Link href="/fafsa" className="text-sm font-semibold text-brand hover:underline">Open</Link>} />
              <div className="space-y-3 p-4 text-sm">
                <div className="flex items-center justify-between"><span>Award year</span><span className="font-semibold">{s.fafsa?.awardYear ?? "2027–28"}</span></div>
                <div className="flex items-center justify-between"><span>Status</span>{fafsaSubmitted ? <Badge tone="green">Submitted</Badge> : <Badge tone="amber">In progress</Badge>}</div>
                <Progress value={s.fPct} tone="teal" />
                <div className="flex items-center justify-between"><span>NC residency (RDS)</span><StatusPill status={res === "determined_resident" ? "verified" : res} /></div>
              </div>
            </Card>
            <Card>
              <CardHeader title="Scholarships" action={<Link href="/my-scholarships" className="text-sm font-semibold text-brand hover:underline">Open</Link>} />
              <ul className="divide-y divide-line text-sm">
                {s.schApps.slice(0, 4).map((x) => <li key={x.id} className="flex items-center justify-between gap-2 px-4 py-2.5"><span className="truncate">{x.scholarship?.name}</span><StatusPill status={x.status} /></li>)}
                {s.schApps.length === 0 && <li className="px-4 py-4 text-muted">None tracked yet. <Link href="/scholarships" className="link">Find scholarships</Link></li>}
              </ul>
            </Card>
            <Card>
              <CardHeader title="Internships & Jobs" action={<Link href="/my-jobs" className="text-sm font-semibold text-brand hover:underline">Open</Link>} />
              <ul className="divide-y divide-line text-sm">
                {s.jobApps.slice(0, 4).map((x) => <li key={x.id} className="flex items-center justify-between gap-2 px-4 py-2.5"><span className="truncate">{x.job?.title}</span><StatusPill status={x.status} /></li>)}
                {s.jobApps.length === 0 && <li className="px-4 py-4 text-muted">No applications tracked. <Link href="/internships" className="link">Browse internships</Link></li>}
              </ul>
            </Card>
            <Card>
              <CardHeader title="My Network & Career Path" />
              <div className="grid grid-cols-2 gap-3 p-4 text-sm">
                <Link href="/network" className="rounded-lg bg-canvas p-3 hover:ring-1 hover:ring-brand"><Users className="h-4 w-4 text-brand" /><p className="mt-1 text-xl font-bold">{s.connections}</p><p className="text-xs text-muted">connections</p></Link>
                <Link href="/groups" className="rounded-lg bg-canvas p-3 hover:ring-1 hover:ring-brand"><Users className="h-4 w-4 text-brand" /><p className="mt-1 text-xl font-bold">{s.groups}</p><p className="text-xs text-muted">groups</p></Link>
                <Link href="/careers" className="col-span-2 rounded-lg bg-canvas p-3 hover:ring-1 hover:ring-brand">
                  <p className="flex items-center gap-1.5 text-xs text-muted"><Compass className="h-4 w-4 text-brand" /> Career interests</p>
                  <p className="mt-1 font-semibold">{s.profile?.careerInterests.join(", ") || "Add interests to your profile"}</p>
                  {s.profile?.learningFormat && <p className="text-xs text-muted">Preferred format: {label(s.profile.learningFormat === "on_campus" ? "On campus" : s.profile.learningFormat)}</p>}
                </Link>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="My path: graduation → first semester" />
            <ol className="flex gap-0 overflow-x-auto p-4">
              {timeline.map((t, i) => (
                <li key={t.label} className="relative min-w-[120px] flex-1 text-center">
                  {i > 0 && <span className={`absolute left-0 right-1/2 top-3 h-0.5 ${t.done || i <= firstOpen ? "bg-teal" : "bg-line"}`} />}
                  {i < timeline.length - 1 && <span className={`absolute left-1/2 right-0 top-3 h-0.5 ${timeline[i + 1].done || i + 1 <= firstOpen ? "bg-teal" : "bg-line"}`} />}
                  <span className={`relative z-10 mx-auto flex h-6 w-6 items-center justify-center rounded-full border-2 ${t.done ? "border-teal bg-teal text-white" : i === firstOpen ? "border-brand bg-surface" : "border-line bg-surface"}`}>
                    {t.done && <CheckCircle2 className="h-4 w-4" />}
                  </span>
                  <p className={`mt-2 px-1 text-xs ${i === firstOpen ? "font-semibold text-brand" : t.done ? "text-fg" : "text-muted"}`}>{t.label}</p>
                  {i === firstOpen && <p className="text-[10px] font-semibold uppercase text-brand">You are here</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="My Deadlines" action={<Link href="/calendar" className="text-sm font-semibold text-brand hover:underline">Calendar</Link>} />
            {s.upcoming.length === 0 ? <EmptyState icon={<ClipboardList className="h-5 w-5" />} title="No upcoming tasks" action={<Link href="/calendar" className="btn-secondary btn-sm">Add a deadline</Link>} /> : (
              <ul className="divide-y divide-line">
                {s.upcoming.slice(0, 7).map((t) => {
                  const d = daysUntil(t.date);
                  return (
                    <li key={t.id} className="flex items-start gap-3 px-4 py-3">
                      <ActionButton className="mt-0.5 rounded-full text-muted hover:text-teal" title="Mark complete" action={toggleTask.bind(null, t.id)}><Circle className="h-5 w-5" /><span className="sr-only">Mark {t.title} complete</span></ActionButton>
                      <div className="min-w-0 flex-1">
                        {t.href ? <Link href={t.href} className="text-sm font-medium hover:text-brand">{t.title}</Link> : <p className="text-sm font-medium">{t.title}</p>}
                        <p className={`text-xs ${d != null && d < 0 ? "font-semibold text-red-600" : d != null && d <= 7 ? "font-semibold text-amber-600" : "text-muted"}`}>
                          {t.date ? `${formatDate(t.date)} · ${d! < 0 ? `${-d!} days overdue` : d === 0 ? "today" : `in ${d} days`}` : "No date"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Card className="p-4">
            <h2 className="font-semibold">Saved notes</h2>
            <p className="mb-2 text-xs text-muted">Private to you. Don't store passwords, SSNs or ID numbers.</p>
            <NotesBox initial={String((notes?.data as { text?: string } | undefined)?.text ?? "")} />
          </Card>
          <Notice tone="blue" title="Share with a parent">
            You can give a parent or guardian read-only access to your planning checklist from <Link className="link" href="/settings#parent">Settings</Link>.
          </Notice>
        </aside>
      </div>
    </div>
  );
}

function SummaryTile({ icon, title, href, value, sub, pct, tone = "brand" }: { icon: React.ReactNode; title: string; href: string; value: string; sub: string; pct: number; tone?: "brand" | "teal" | "green" | "amber" }) {
  return (
    <Link href={href} className="card block p-4 transition hover:-translate-y-0.5 hover:border-brand">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted"><span className="text-brand">{icon}</span>{title}</div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mb-2 text-xs text-muted">{sub}</p>
      <Progress value={pct} tone={tone} label={title} />
    </Link>
  );
}

function ProDashboard({ name, verified }: { name: string; verified: boolean }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <PageHeader eyebrow="Mentor & Counselor Dashboard" title={`Welcome, ${name.split(" ")[0]}`} />
      {!verified && <div className="mb-4"><Notice tone="amber" title="Verification pending">Your account must be verified before students under 18 can connect with you. Our team reviews requests in Admin → Users.</Notice></div>}
      <div className="grid gap-4 sm:grid-cols-2">
        {[["/network/invitations", "Connection requests", "Students may request to connect with verified mentors and counselors."], ["/groups", "Groups you moderate", "Review join requests and keep discussions safe."], ["/feed", "Share guidance", "Post advice with links to official sources."], ["/resources", "Resource library", "Official links to share with students."]].map(([href, t, d]) => (
          <Link key={href} href={href} className="card p-5 hover:border-brand"><p className="font-semibold">{t}</p><p className="mt-1 text-sm text-muted">{d}</p></Link>
        ))}
      </div>
      <div className="mt-4"><Notice tone="blue">Mentor Match (supervised, opt-in mentoring sessions) is planned for Phase 3 and isn't available yet.</Notice></div>
    </div>
  );
}
