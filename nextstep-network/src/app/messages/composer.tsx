"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Send } from "lucide-react";
import { report, sendMessage } from "@/app/actions/social";
import { FormMessage, SubmitButton } from "@/components/client-ui";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [state, action] = useFormState(sendMessage, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="border-t border-line p-3">
      <input type="hidden" name="conversationId" value={conversationId} />
      <div className="flex gap-2">
        <label htmlFor="msg" className="sr-only">Message</label>
        <textarea id="msg" name="body" rows={2} maxLength={2000} required placeholder="Write a message…" className="input" />
        <SubmitButton className="btn-primary self-end" pendingText="…"><Send className="h-4 w-4" /><span className="sr-only">Send</span></SubmitButton>
      </div>
      <FormMessage state={state?.error ? state : undefined} />
    </form>
  );
}

export function ReportMessage({ conversationId }: { conversationId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(report, undefined);
  if (!open) return <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(true)}>Report</button>;
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="targetType" value="message" /><input type="hidden" name="targetId" value={conversationId} />
      <select name="reason" aria-label="Reason" className="input w-auto py-1 text-xs"><option>Harassment</option><option>Spam or scam</option><option>Inappropriate</option><option>Other</option></select>
      <SubmitButton className="btn-danger btn-sm">Send</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
