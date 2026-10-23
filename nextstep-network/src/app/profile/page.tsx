import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileView } from "@/components/profile-view";

export const metadata: Metadata = { title: "My Profile" };

export default async function MyProfile() {
  const user = await requireUser();
  const store = await db();
  const profile = await store.find("profiles", { userId: user.id });
  if (!profile) return <p className="p-8">Profile not found.</p>;
  return <ProfileView owner={user} profile={profile} viewer={user} isSelf connected={false} />;
}
