"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/format";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "What should I do next to prepare for college?",
  "How do I complete my FAFSA?",
  "How do I transfer from community college?",
  "How can I become a nurse?",
  "How do I get a college application fee waiver?",
  "Help me build my resume.",
];

export async function callAi(mode: string, message: string, history: Msg[] = []): Promise<{ reply?: string; error?: string }> {
  try {
    const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, message, history }) });
    const data = await res.json();
    return res.ok ? { reply: data.reply } : { error: data.error ?? "Something went wrong." };
  } catch {
    return { error: "Network error. Check your connection and try again." };
  }
}

/** Renders AI text safely as paragraphs and lists (no HTML injection). */
export function AiText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((l, i) => {
        const t = l.replace(/\*\*(.+?)\*\*/g, "$1");
        if (/^\s*[-*•]\s+/.test(t)) return <p key={i} className="pl-3">• {t.replace(/^\s*[-*•]\s+/, "")}</p>;
        return t.trim() ? <p key={i}>{t}</p> : null;
      })}
    </div>
  );
}

export function AiAdvisor() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setError("");
    const history = msgs;
    setMsgs([...history, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    const r = await callAi("advisor", q, history);
    setBusy(false);
    if (r.reply) setMsgs((m) => [...m, { role: "assistant", content: r.reply! }]);
    else setError(r.error!);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("no-print fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-navy-700 lg:bottom-6", open && "hidden")}
        aria-label="Open NextStep AI Advisor"
      >
        <Sparkles className="h-4 w-4 text-teal" aria-hidden /> AI Advisor
      </button>
      {open && (
        <div role="dialog" aria-label="NextStep AI Advisor" className="no-print fixed inset-x-2 bottom-20 z-50 flex max-h-[75vh] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[400px] lg:bottom-6">
          <div className="flex items-center justify-between bg-navy px-4 py-3 text-white">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-teal" aria-hidden /><span className="font-semibold">NextStep AI Advisor</span></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded p-1 hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            <p className="rounded-lg bg-canvas p-3 text-xs text-muted">I give general guidance and link to official sources. I can make mistakes — always confirm deadlines and requirements with the school or sponsor. Never share your SSN, passwords or FSA ID here.</p>
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((s) => <button key={s} type="button" onClick={() => send(s)} className="chip hover:border-brand hover:text-brand">{s}</button>)}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={cn("max-w-[90%] rounded-2xl px-3 py-2", m.role === "user" ? "ml-auto bg-brand text-white" : "bg-canvas text-fg")}>
                {m.role === "assistant" ? <AiText text={m.content} /> : m.content}
              </div>
            ))}
            {busy && <p className="flex items-center gap-2 text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</p>}
            {error && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">{error}</p>}
            <div ref={end} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-line p-3">
            <label htmlFor="ai-input" className="sr-only">Ask a question</label>
            <input id="ai-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000} placeholder="Ask about colleges, FAFSA, careers…" className="input" />
            <button type="submit" disabled={busy || !input.trim()} className="btn-primary px-3" aria-label="Send"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      )}
    </>
  );
}

/** Inline writing assistant used on profile, essay and resume pages. */
export function WritingAssist({ mode, getText, label = "Improve with AI" }: { mode: "advisor" | "profile" | "essay" | "resume" | "email"; getText: () => string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ reply?: string; error?: string } | null>(null);
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn-secondary btn-sm"
        disabled={busy}
        onClick={async () => {
          const t = getText().trim();
          if (!t) return setOut({ error: "Write something first, then ask for suggestions." });
          setBusy(true);
          setOut(await callAi(mode, t));
          setBusy(false);
        }}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} {label}
      </button>
      {out?.reply && <div className="rounded-lg border border-teal-100 bg-teal-50 p-3 text-sm text-fg dark:border-teal/30 dark:bg-teal/10"><p className="mb-1 text-xs font-semibold text-teal-700 dark:text-teal">AI suggestions — keep only what's true for you</p><AiText text={out.reply} /></div>}
      {out?.error && <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">{out.error}</p>}
    </div>
  );
}
