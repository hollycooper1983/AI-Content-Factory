import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, Notice } from "@/components/ui";
import { ProfileForm } from "./form";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfile({ searchParams }: { searchParams: { welcome?: string } }) {
  const user = await requireUser();
  const store = await db();
  const profile = await store.find("profiles", { userId: user.id });
  if (!profile) return null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <PageHeader title="Edit your profile" subtitle="Share what you're proud of and where you're headed. Only add real experiences — the AI helper improves wording but never invents achievements." />
      {searchParams.welcome && <div className="mb-4"><Notice tone="green" title="Welcome to NextStep Network!">Start with a headline and your career interests. You can finish the rest anytime.</Notice></div>}
      <ProfileForm profile={profile} name={user.name} isMinor={user.ageGroup === "minor"} />
    </div>
  );
}
