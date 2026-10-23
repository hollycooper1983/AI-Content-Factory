import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignupForm } from "./form";

export const metadata: Metadata = { title: "Join NextStep Network", description: "Create your free student profile on NextStep Network." };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/feed");
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Join NextStep Network</h1>
        <p className="mt-1 text-sm text-muted">Create one account you can keep from high school through your career. We only ask for what we need.</p>
        <SignupForm />
      </div>
    </div>
  );
}
