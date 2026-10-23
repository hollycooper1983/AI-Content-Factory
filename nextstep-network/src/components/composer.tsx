"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Image as ImageIcon, Link2, X } from "lucide-react";
import { createPost } from "@/app/actions/social";
import { Avatar, FormMessage, SubmitButton } from "./client-ui";

export function Composer({ name, avatar, groupId, orgs = [] }: { name: string; avatar: string; groupId?: string; orgs?: { id: string; name: string }[] }) {
  const [state, action] = useFormState(createPost, undefined);
  const [open, setOpen] = useState(false);
  const [extra, setExtra] = useState<"" | "link" | "image">("");
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state?.ok) return;
    formRef.current?.reset();
    setOpen(false);
    setExtra("");
  }, [state]);
  return (
    <section className="card p-4" aria-label="Create a post">
      <div className="flex gap-3">
        <Avatar src={avatar} name={name} size={48} />
        {!open ? (
          <button type="button" onClick={() => setOpen(true)} className="flex-1 rounded-full border border-line px-4 text-left text-sm font-medium text-muted hover:bg-canvas">
            Share an update, question or achievement…
          </button>
        ) : <p className="self-center text-sm font-semibold">Create a post</p>}
      </div>
      {open && (
        <form ref={formRef} action={action} className="mt-3 space-y-3">
          {groupId && <input type="hidden" name="groupId" value={groupId} />}
          <label htmlFor="post-body" className="sr-only">Post text</label>
          <textarea id="post-body" name="body" rows={4} maxLength={3000} autoFocus required placeholder="What do you want to talk about? Never share phone numbers, addresses or ID numbers." className="input resize-y" />
          {extra === "link" && <input name="link" type="url" placeholder="https://… (official sources preferred)" className="input" aria-label="Link URL" />}
          {extra === "image" && <input name="imageUrl" type="url" placeholder="https://… image URL" className="input" aria-label="Image URL" />}
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="post-cat" className="sr-only">Category</label>
            <select id="post-cat" name="category" className="input w-auto py-1.5" defaultValue="general">
              <option value="general">Update</option><option value="question">Career question</option><option value="success">Achievement</option>
              <option value="advice">Advice</option><option value="scholarship">Scholarship</option><option value="college">College</option>
              <option value="internship">Internship</option><option value="event">Event</option>
            </select>
            {orgs.length > 0 && (
              <select name="asOrg" className="input w-auto py-1.5" aria-label="Post as">
                <option value="">Post as myself</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>Post as {o.name}</option>)}
              </select>
            )}
            <button type="button" className="btn-ghost btn-sm" onClick={() => setExtra(extra === "link" ? "" : "link")}><Link2 className="h-4 w-4" /> Link</button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setExtra(extra === "image" ? "" : "image")}><ImageIcon className="h-4 w-4" /> Image</button>
            <div className="ml-auto flex gap-2">
              <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}><X className="h-4 w-4" /> Cancel</button>
              <SubmitButton className="btn-primary btn-sm" pendingText="Posting…">Post</SubmitButton>
            </div>
          </div>
          <FormMessage state={state?.error ? state : undefined} />
        </form>
      )}
    </section>
  );
}
