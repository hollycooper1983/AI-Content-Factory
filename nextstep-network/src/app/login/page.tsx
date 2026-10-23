import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/seed";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  if (await getCurrentUser()) redirect("/feed");
  const demo = process.env.DEMO_MODE !== "false" && !process.env.SUPABASE_URL;
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-2">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-muted">Welcome back to NextStep Network.</p>
        <LoginForm next={searchParams.next ?? ""} />
      </div>
      {demo && (
        <div className="card p-6 sm:p-8">
          <h2 className="font-semibold">Explore with a demo account</h2>
          <p className="mt-1 text-sm text-muted">All demo people and employers are fictional. Password for every demo account:</p>
          <p className="mt-2 rounded-lg bg-canvas px-3 py-2 font-mono text-sm">{DEMO_PASSWORD}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email} className="rounded-lg border border-line p-3">
                <p className="font-medium">{a.label}</p>
                <p className="font-mono text-xs text-muted">{a.email}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
