import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, Briefcase, CalendarCheck, GraduationCap, Lock, Search, ShieldCheck, Sparkles, Trophy, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { img } from "@/lib/images";
import { SafeImage } from "@/components/client-ui";

export default async function Home({ searchParams }: { searchParams: { deleted?: string } }) {
  if (await getCurrentUser()) redirect("/feed");
  const features = [
    { icon: Users, title: "Professional student profiles", body: "One account from high school through your first job. Showcase skills, projects, volunteering and goals.", href: "/how-it-works" },
    { icon: GraduationCap, title: "College Finder & Application Center", body: "Search colleges by format, cost, HBCU status and more. Track every application, checklist and deadline.", href: "/colleges" },
    { icon: Trophy, title: "Scholarships & FAFSA", body: "Discover real scholarships linked to official sponsors and follow a step-by-step FAFSA checklist.", href: "/scholarships" },
    { icon: Briefcase, title: "Internships & Jobs", body: "Student jobs, paid internships and apprenticeships from verified employers, clearly labeled.", href: "/internships" },
    { icon: CalendarCheck, title: "Student Command Center", body: "Your deadlines, progress and next steps in one dashboard. Share a checklist with a parent if you choose.", href: "/how-it-works" },
    { icon: Sparkles, title: "NextStep AI Advisor", body: "Ask questions about colleges, aid and careers. Get guidance that links to official sources.", href: "/how-it-works" },
  ];
  return (
    <>
      {searchParams.deleted && <p className="bg-green-50 py-2 text-center text-sm text-green-800">Your account and data were deleted.</p>}
      <section className="relative overflow-hidden bg-surface">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:border-teal/30 dark:bg-teal/10 dark:text-teal">
              <ShieldCheck className="h-3.5 w-3.5" /> Built for students, with safety by design
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-navy dark:text-white sm:text-5xl lg:text-6xl">
              Your network for college, careers <span className="bg-gradient-to-r from-brand to-teal bg-clip-text text-transparent">and what comes next.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              NextStep Network is the professional community for high school students, college students and recent graduates. Connect with classmates and mentors, find colleges and scholarships, and stay on top of every application.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary px-6 py-3 text-base">Create your free account <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/login" className="btn-secondary px-6 py-3 text-base">Explore the demo</Link>
            </div>
            <form action="/colleges" className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-line bg-canvas p-1.5 pl-4">
              <Search className="h-4 w-4 text-muted" aria-hidden />
              <label htmlFor="hero-q" className="sr-only">Search colleges</label>
              <input id="hero-q" name="q" placeholder="Search colleges, e.g. “online biology” or “HBCU”" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted" />
              <button className="btn-primary">Search</button>
            </form>
            <p className="mt-3 text-xs text-muted">Free for students. We never sell student data.</p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-0 rounded-[2rem] bg-gradient-to-br from-brand/20 via-teal/20 to-transparent blur-2xl" />
            <SafeImage src={img("hero")} alt="Students collaborating around a laptop in a library" className="relative aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl" />
            <div className="absolute -bottom-6 left-4 hidden w-64 rounded-2xl border border-line bg-surface p-4 shadow-xl sm:block">
              <p className="text-xs font-semibold text-muted">Jordan's Command Center <span className="font-normal">(demo)</span></p>
              <div className="mt-2 space-y-2 text-xs">
                <div className="flex justify-between"><span>FAFSA</span><span className="font-semibold text-green-600">Submitted</span></div>
                <div className="flex justify-between"><span>JCC application</span><span className="font-semibold text-brand">Submitted</span></div>
                <div className="flex justify-between"><span>Residency (RDS)</span><span className="font-semibold text-amber-600">Pending</span></div>
              </div>
            </div>
            <div className="absolute -right-2 top-6 hidden rounded-2xl border border-line bg-surface p-3 shadow-xl sm:flex sm:items-center sm:gap-2">
              <BadgeCheck className="h-5 w-5 text-brand" />
              <span className="text-xs font-semibold">Verified employers only</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight">Everything you need for your next step</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted">Networking like a professional social platform, planning tools like a student success dashboard.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body, href }) => (
            <Link key={title} href={href} className="card group p-6 transition hover:-translate-y-0.5 hover:border-brand">
              <div className="inline-flex rounded-xl bg-brand-50 p-2.5 text-brand dark:bg-brand/15"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold text-fg">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">Learn more <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
          <SafeImage src={img("lab")} alt="Community college student working in a science lab" className="aspect-[4/3] w-full rounded-3xl object-cover" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">Plan smarter</p>
            <h2 className="mt-2 text-3xl font-bold">From community college to a bachelor's degree, mapped out.</h2>
            <p className="mt-4 text-blue-100">Build a semester-by-semester transfer plan, see which courses need in-person labs, compare online programs, and keep verified and unverified requirements clearly separated.</p>
            <ul className="mt-6 space-y-2 text-sm text-blue-100">
              <li className="flex gap-2"><BadgeCheck className="h-5 w-5 shrink-0 text-teal" /> Official links to StudentAid.gov, CFNC, NC Residency and Common App</li>
              <li className="flex gap-2"><BadgeCheck className="h-5 w-5 shrink-0 text-teal" /> Source and verification status shown on every college and scholarship</li>
              <li className="flex gap-2"><BadgeCheck className="h-5 w-5 shrink-0 text-teal" /> Free application and fee-waiver tracking</li>
            </ul>
            <Link href="/transfer-planner" className="btn mt-8 bg-white text-navy hover:bg-blue-50">Try the Transfer Planner</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700 dark:text-teal">Safety by design</p>
            <h2 className="mt-2 text-3xl font-bold">A professional network that protects younger students</h2>
            <ul className="mt-6 space-y-4 text-sm text-muted">
              <li className="flex gap-3"><Lock className="h-5 w-5 shrink-0 text-brand" /> Profiles for students under 18 are private by default and never public.</li>
              <li className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-brand" /> Adults can't send connection requests to students under 18, and direct messaging stays off for minors in this release.</li>
              <li className="flex gap-3"><BadgeCheck className="h-5 w-5 shrink-0 text-brand" /> Employers, colleges, mentors and counselors are verified before they get posting privileges.</li>
              <li className="flex gap-3"><Users className="h-5 w-5 shrink-0 text-brand" /> Reporting, blocking and human moderation on every post, group and listing.</li>
            </ul>
          </div>
          <SafeImage src={img("online")} alt="Student studying an online course at home" className="aspect-[4/3] w-full rounded-3xl object-cover" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8">
        <div className="rounded-3xl bg-gradient-to-r from-brand to-teal p-10 text-center text-white">
          <h2 className="text-3xl font-bold">Take your next step today.</h2>
          <p className="mx-auto mt-2 max-w-xl text-blue-50">Join free. Build your profile in minutes and keep it for your entire educational journey.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="btn bg-white px-6 py-3 text-navy hover:bg-blue-50">Join NextStep Network</Link>
            <Link href="/scholarships" className="btn border border-white/70 px-6 py-3 text-white hover:bg-white/10">Browse scholarships</Link>
          </div>
        </div>
      </section>
    </>
  );
}
