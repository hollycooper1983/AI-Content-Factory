"use client";

import { useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Copy, Download, Trash2 } from "lucide-react";
import { deleteEssay, saveEssay } from "@/app/actions/planning";
import { ActionButton, FormMessage, SubmitButton } from "@/components/client-ui";
import { WritingAssist } from "@/components/ai-advisor";
import type { Essay } from "@/lib/types";

export function EssayEditor({ essay }: { essay: Essay | null }) {
  const [state, action] = useFormState(saveEssay, undefined);
  const latest = essay?.versions[essay.versions.length - 1]?.body ?? "";
  const [body, setBody] = useState(latest);
  const [copied, setCopied] = useState(false);
  const prompt = useRef<HTMLTextAreaElement>(null);
  const words = body.split(/\s+/).filter(Boolean).length;
  const download = () => {
    const blob = new Blob([body], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${essay?.title ?? "essay"}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <form action={action} className="card space-y-3 p-5">
      {essay && <input type="hidden" name="id" value={essay.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="title">Title</label><input id="title" name="title" defaultValue={essay?.title} className="input" /></div>
        <div><label className="label" htmlFor="target">For (college or scholarship)</label><input id="target" name="target" defaultValue={essay?.target} className="input" /></div>
      </div>
      <div><label className="label" htmlFor="prompt">Prompt</label><textarea ref={prompt} id="prompt" name="prompt" rows={2} defaultValue={essay?.prompt} className="input" /></div>
      <div>
        <div className="flex items-end justify-between"><label className="label" htmlFor="body">Draft</label><span className="text-xs text-muted">{words} words</span></div>
        <textarea id="body" name="body" rows={16} value={body} onChange={(e) => setBody(e.target.value)} className="input font-serif text-[15px] leading-relaxed" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton>Save draft</SubmitButton>
        <button type="button" className="btn-ghost btn-sm" onClick={async () => { await navigator.clipboard.writeText(body); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy"}</button>
        <button type="button" className="btn-ghost btn-sm" onClick={download}><Download className="h-4 w-4" /> Download .txt</button>
        {essay && <ActionButton className="btn-ghost btn-sm text-red-600" confirm="Delete this essay and all versions?" action={deleteEssay.bind(null, essay.id)}><Trash2 className="h-4 w-4" /> Delete</ActionButton>}
        <FormMessage state={state} />
      </div>
      <div className="rounded-lg bg-canvas p-3">
        <p className="mb-2 text-sm font-semibold">AI brainstorming & feedback</p>
        <p className="mb-2 text-xs text-muted">The assistant asks questions, suggests structure and catches grammar issues. It won't write your essay or invent experiences.</p>
        <WritingAssist mode="essay" getText={() => `Prompt: ${prompt.current?.value ?? ""}\n\nMy draft:\n${body}`} label="Get feedback" />
      </div>
    </form>
  );
}
