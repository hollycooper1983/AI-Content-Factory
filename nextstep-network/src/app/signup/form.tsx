"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import { signup } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/client-ui";

const ROLES = [
  { value: "student", label: "Student", desc: "High school, community college, university, trade school or recent graduate" },
  { value: "parent", label: "Parent or guardian", desc: "Support your student's planning when they invite you" },
  { value: "counselor", label: "School counselor / advisor", desc: "Requires verification" },
  { value: "mentor", label: "Mentor or alumni", desc: "Requires verification" },
  { value: "college", label: "College or university representative", desc: "Requires verification" },
  { value: "employer", label: "Employer", desc: "Requires verification before posting opportunities" },
];

export function SignupForm() {
  const [state, action] = useFormState(signup, undefined);
  const [age, setAge] = useState("");
  const fe = state?.fieldErrors ?? {};
  const err = (k: string) => fe[k] && <p className="mt-1 text-xs text-red-600" id={`${k}-err`}>{fe[k]}</p>;
  return (
    <form action={action} className="mt-6 space-y-5" noValidate>
      <fieldset>
        <legend className="label">I am joining as</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLES.map((r, i) => (
            <label key={r.value} className="flex cursor-pointer gap-2 rounded-lg border border-line p-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-50 dark:has-[:checked]:bg-brand/10">
              <input type="radio" name="role" value={r.value} defaultChecked={i === 0} className="mt-0.5" />
              <span><span className="font-medium">{r.label}</span><span className="block text-xs text-muted">{r.desc}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="name" className="label">Full name or display name</label>
        <input id="name" name="name" autoComplete="name" className="input" aria-describedby="name-err" />
        {err("name")}
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" className="input" aria-describedby="email-err" />
        {err("email")}
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} className="input" aria-describedby="password-err pw-help" />
        <p id="pw-help" className="mt-1 text-xs text-muted">At least 10 characters.</p>
        {err("password")}
      </div>
      <fieldset>
        <legend className="label">Age</legend>
        <p className="mb-2 text-xs text-muted">We use your age range (not your birthday) to apply age-appropriate privacy protections.</p>
        <div className="flex flex-wrap gap-2">
          {[["13to17", "13–17"], ["18plus", "18 or older"], ["under13", "Under 13"]].map(([v, l]) => (
            <label key={v} className="chip cursor-pointer px-3 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:text-brand">
              <input type="radio" name="age" value={v} className="sr-only" onChange={() => setAge(v)} /> {l}
            </label>
          ))}
        </div>
        {err("age")}
        {age === "13to17" && (
          <p className="mt-2 rounded-lg bg-brand-50 p-3 text-xs text-navy dark:bg-brand/10 dark:text-blue-100">
            Your profile will start private and can only be shared with your network. Adults can't send you connection requests, and direct messaging is turned off for members under 18.
          </p>
        )}
        {age === "under13" && <p className="mt-2 text-xs text-amber-700">NextStep Network is for students 13 and older.</p>}
      </fieldset>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="terms" className="mt-0.5" />
        <span>I agree to the <Link href="/help#guidelines" className="link">Community Guidelines</Link> and understand how my information is used (<Link href="/help#privacy" className="link">Privacy</Link>).</span>
      </label>
      {err("terms")}
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Creating account…">Create account</SubmitButton>
      <p className="text-center text-sm text-muted">Already have an account? <Link href="/login" className="link">Sign in</Link></p>
    </form>
  );
}
