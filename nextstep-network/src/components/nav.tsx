import Link from "next/link";
import { Bell } from "lucide-react";
import { logout } from "@/app/actions/auth";
import type { SafeUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Profile } from "@/lib/types";
import { Logo } from "./logo";
import { MeMenu, MobileBottomNav, MoreMenu, NavLinks, SearchBox, ThemeToggle } from "./nav-client";

async function unreadCounts(userId: string) {
  const store = await db();
  const [notes, convs] = await Promise.all([store.all("notifications", { userId, read: false }), store.all("conversations")]);
  const mine = convs.filter((c) => c.participantIds.includes(userId)).map((c) => c.id);
  let messages = 0;
  for (const id of mine) messages += (await store.all("messages", { conversationId: id })).filter((m) => !m.readBy.includes(userId)).length;
  return { notifications: notes.length, messages };
}

export async function TopNav({ user, profile }: { user: SafeUser; profile: Profile | null }) {
  const counts = await unreadCounts(user.id);
  return (
    <>
      <header className="no-print sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <nav aria-label="Main" className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
          <Logo compact href="/feed" />
          <SearchBox className="w-full max-w-[280px] flex-1" />
          <div className="ml-auto flex items-center">
            <NavLinks counts={counts} />
            <Link href="/notifications" className="relative rounded-full p-2 text-muted lg:hidden" aria-label={`Notifications (${counts.notifications} unread)`}>
              <Bell className="h-5 w-5" />
              {counts.notifications > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-600" />}
            </Link>
            <ThemeToggle />
            <div className="hidden sm:block"><MeMenu name={user.name} avatar={profile?.avatarUrl ?? ""} headline={profile?.headline ?? ""} role={user.role} signOut={logout} /></div>
            <MoreMenu />
          </div>
        </nav>
      </header>
      <MobileBottomNav unread={counts.messages} />
    </>
  );
}

export function PublicNav() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Logo />
        <ul className="ml-6 hidden items-center gap-5 text-sm font-medium text-muted md:flex">
          <li><Link href="/colleges" className="hover:text-fg">Colleges</Link></li>
          <li><Link href="/scholarships" className="hover:text-fg">Scholarships</Link></li>
          <li><Link href="/internships" className="hover:text-fg">Internships</Link></li>
          <li><Link href="/jobs" className="hover:text-fg">Jobs</Link></li>
          <li><Link href="/careers" className="hover:text-fg">Careers</Link></li>
          <li><Link href="/resources" className="hover:text-fg">Resources</Link></li>
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/signup" className="btn-primary">Join now</Link>
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  const cols = [
    { title: "Explore", links: [["/colleges", "College Finder"], ["/scholarships", "Scholarships"], ["/internships", "Internships"], ["/jobs", "Jobs"], ["/careers", "Careers"]] },
    { title: "Plan", links: [["/fafsa", "FAFSA Command Center"], ["/applications", "Application Center"], ["/transfer-planner", "Transfer Planner"], ["/residency", "NC Residency"]] },
    { title: "Company", links: [["/about", "About"], ["/how-it-works", "How It Works"], ["/resources", "Resources"], ["/help", "Help Center"]] },
    { title: "Safety", links: [["/help#safety", "Student Safety"], ["/help#privacy", "Privacy"], ["/resources#scam-checker", "Scam Checker"], ["/help#guidelines", "Community Guidelines"]] },
  ];
  return (
    <footer className="no-print mt-16 border-t border-line bg-surface pb-20 lg:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted">Connect. Learn. Apply. Succeed.</p>
          <p className="mt-3 text-xs text-muted">NextStep Network is not affiliated with, endorsed by, or a substitute for the U.S. Department of Education, CFNC, Common App, or any institution listed. We never submit applications on your behalf.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-semibold text-fg">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {c.links.map(([href, l]) => <li key={href}><Link href={href} className="hover:text-fg">{l}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-muted">© {new Date().getFullYear()} NextStep Network. We do not sell student data.</p>
    </footer>
  );
}
