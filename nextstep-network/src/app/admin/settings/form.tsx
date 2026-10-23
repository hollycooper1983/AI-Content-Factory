"use client";

import { useFormState } from "react-dom";
import { saveSetting } from "@/app/actions/admin";
import { FormMessage, SubmitButton } from "@/components/client-ui";

export function AnnouncementForm({ value }: { value: string }) {
  const [state, action] = useFormState(saveSetting, undefined);
  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="key" value="announcement" />
      <label htmlFor="ann" className="sr-only">Announcement</label>
      <textarea id="ann" name="value" rows={2} defaultValue={value} maxLength={500} className="input" />
      <div className="flex items-center gap-2"><SubmitButton>Save</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
