import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { viewableProfile } from "@/lib/queries";
import { ProfileView } from "@/components/profile-view";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function MemberProfile({ params }: { params: { id: string } }) {
  const viewer = await getCurrentUser();
  if (viewer?.id === params.id) redirect("/profile");
  const r = await viewableProfile(viewer, params.id);
  if (!r) notFound();
  if (!r.allowed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-muted" />
          <h1 className="mt-3 text-xl font-bold">This profile is private</h1>
          <p className="mt-1 text-sm text-muted">{r.owner.name} shares their profile only with their network.</p>
          {!viewer && <Link href={`/login?next=/profile/${params.id}`} className="btn-primary mt-5">Sign in</Link>}
        </Card>
      </div>
    );
  }
  return <ProfileView owner={r.owner} profile={r.profile} viewer={viewer} isSelf={false} connected={r.connected} />;
}
