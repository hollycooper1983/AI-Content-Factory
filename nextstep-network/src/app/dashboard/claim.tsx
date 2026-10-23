"use client";

import { useFormState } from "react-dom";
import { claimParentCode } from "@/app/actions/planning";
import { FormMessage, SubmitButton } from "@/components/client-ui";

export function ClaimCodeForm() {
  const [state, action] = useFormState(claimParentCode, undefined);
  return (
    <form action={action} className="mt-3 flex flex-wrap items-end gap-2">
      <div><label htmlFor="code" className="label">Student's link code</label><input id="code" name="code" className="input uppercase" maxLength={12} /></div>
      <SubmitButton>Link student</SubmitButton>
      <div className="w-full"><FormMessage state={state} /></div>
    </form>
  );
}
