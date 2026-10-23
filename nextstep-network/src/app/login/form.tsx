"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { login } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/client-ui";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useFormState(login, undefined);
  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Signing in…">Sign in</SubmitButton>
      <p className="text-center text-sm text-muted">New to NextStep? <Link href="/signup" className="link">Join now</Link></p>
      <p className="text-center text-xs text-muted">Forgot your password? Password reset by email becomes available once an email provider is configured. Until then, contact an administrator through the <Link href="/help" className="link">Help Center</Link>.</p>
    </form>
  );
}
