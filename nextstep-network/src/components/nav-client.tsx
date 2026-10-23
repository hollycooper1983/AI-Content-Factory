"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell, Briefcase, ChevronDown, GraduationCap, Home, LayoutGrid, MessageSquare, Moon, Search, Sun, Trophy, Users, User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/format";
import { Avatar } from "./client-ui";

const MAIN = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/network", label: "My Network", icon: Users },
  { href: "/colleges", label: "Colleges", icon: GraduationCap },
  { href: "/scholarships", label: "Scholarships", icon: Trophy },
  { href: "/jobs", label: "Internships & Jobs", icon: Briefcase },
  { href: "/messages", label: "Messaging", icon: MessageSquare, badge: "messages" as const },
  { href: "/notifications", label: "Notifications", icon: Bell, badge: "notifications" as const },
];

export const MORE_LINKS = [
  { section: "Plan", items: [
    { href: "/dashboard", label: "Student Command Center" },
    { href: "/applications", label: "College Application Center" },
    { href: "/fafsa", label: "FAFSA Command Center" },
    { href: "/financial-aid", label: "Financial Aid Comparison" },
    { href: "/residency", label: "NC Residency & Free Applications" },
    { href: "/calendar", label: "Deadlines & Calendar" },
  ]},
  { section: "Grow", items: [
    { href: "/careers", label: "Career Explorer" },
    { href: "/career-planner", label: "Career Planner & Tools" },
    { href: "/transfer-planner", label: "Transfer Planner" },
    { href: "/resume-builder", label: "Resume Builder" },
    { href: "/groups", label: "Groups" },
    { href: "/organizations", label: "Organizations" },
  ]},
  { section: "Learn", items: [
    { href: "/resources", label: "Student Resources" },
    { href: "/resources#scam-checker", label: "Scholarship Scam Checker" },
    { href: "/resources#financial-literacy", label: "Financial Literacy Hub" },
    { href: "/how-it-works", label: "How It Works" },
  ]},
];

function isActive(path: string, href: string) {
  if (href === "/jobs") return path.startsWith("/jobs") || path.startsWith("/internships");
  return path === href || path.startsWith(href + "/");
}

export function NavLinks({ counts }: { counts: { messages: number; notifications: number } }) {
  const path = usePathname();
  return (
    <ul className="hidden items-stretch lg:flex">
      {MAIN.map(({ href, label, icon: Icon, badge }) => {
        const active = isActive(path, href);
        const n = badge ? counts[badge] : 0;
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-14 w-[84px] flex-col items-center justify-center gap-0.5 border-b-2 text-[11px] leading-tight transition xl:w-[92px]",
                active ? "border-fg text-fg" : "border-transparent text-muted hover:text-fg",
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden />
                {n > 0 && <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-[18px] text-white">{n > 9 ? "9+" : n}</span>}
              </span>
              <span className="truncate text-center">{label}</span>
              {n > 0 && <span className="sr-only">({n} unread)</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function useOutside<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

export function MeMenu({ name, avatar, headline, role, signOut }: { name: string; avatar: string; headline: string; role: string; signOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside<HTMLDivElement>(open, () => setOpen(false));
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  const items = [
    { href: "/profile", label: "View My Profile" },
    { href: "/dashboard", label: "My Dashboard" },
    { href: "/applications", label: "My Applications" },
    { href: "/saved", label: "My Saved Opportunities" },
    ...(role === "employer" || role === "college" ? [{ href: "/organization/dashboard", label: "Organization Dashboard" }] : []),
    ...(role === "admin" ? [{ href: "/admin", label: "Admin Portal" }] : []),
    { href: "/settings", label: "Settings & Privacy" },
    { href: "/help", label: "Help Center" },
  ];
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" className="flex h-14 flex-col items-center justify-center gap-0.5 px-2 text-[11px] text-muted hover:text-fg">
        <Avatar src={avatar} name={name} size={24} />
        <span className="flex items-center">Me <ChevronDown className="h-3 w-3" aria-hidden /></span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[52px] z-50 w-72 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          <div className="flex gap-3 border-b border-line p-4">
            <Avatar src={avatar} name={name} size={48} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-fg">{name}</p>
              <p className="line-clamp-2 text-xs text-muted">{headline || "Add a headline to your profile"}</p>
            </div>
          </div>
          <ul className="py-1 text-sm">
            {items.map((i) => (
              <li key={i.href}><Link role="menuitem" href={i.href} className="block px-4 py-2 text-fg hover:bg-canvas">{i.label}</Link></li>
            ))}
            <li className="border-t border-line">
              <form action={signOut}><button role="menuitem" type="submit" className="block w-full px-4 py-2 text-left text-fg hover:bg-canvas">Sign Out</button></form>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export function MoreMenu() {
  const [open, setOpen] = useState(false);
  const ref = useOutside<HTMLDivElement>(open, () => setOpen(false));
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" className="flex h-14 flex-col items-center justify-center gap-0.5 border-l border-line px-3 text-[11px] text-muted hover:text-fg">
        <LayoutGrid className="h-5 w-5" aria-hidden />
        <span className="flex items-center">More <ChevronDown className="h-3 w-3" aria-hidden /></span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[52px] z-50 grid w-[min(92vw,620px)] grid-cols-1 gap-4 rounded-xl border border-line bg-surface p-5 shadow-xl sm:grid-cols-3">
          {MORE_LINKS.map((s) => (
            <div key={s.section}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{s.section}</p>
              <ul className="space-y-1 text-sm">
                {s.items.map((i) => <li key={i.href}><Link role="menuitem" href={i.href} className="block rounded px-2 py-1.5 text-fg hover:bg-canvas">{i.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="rounded-full p-2 text-muted hover:bg-canvas hover:text-fg"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        try { localStorage.setItem("ns-theme", next ? "dark" : "light"); } catch {}
      }}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export function SearchBox({ className }: { className?: string }) {
  return (
    <form action="/search" role="search" className={cn("relative", className)}>
      <label htmlFor="global-search" className="sr-only">Search NextStep Network</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <input id="global-search" name="q" type="search" placeholder="Search colleges, scholarships, jobs, people…" className="h-9 w-full rounded-md border border-transparent bg-canvas pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:border-brand focus:bg-surface focus:outline-none" />
    </form>
  );
}

const BOTTOM = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/network", label: "Network", icon: Users },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export function MobileBottomNav({ unread }: { unread: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Primary" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {BOTTOM.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px]", active ? "text-brand" : "text-muted")}>
                <span className="relative">
                  <Icon className="h-5 w-5" aria-hidden />
                  {href === "/messages" && unread > 0 && <span className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-red-600" aria-label="unread" />}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
