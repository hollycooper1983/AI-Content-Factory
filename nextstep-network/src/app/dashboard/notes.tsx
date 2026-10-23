"use client";

import { useState } from "react";
import { saveDoc } from "@/app/actions/planning";
import { formatDate } from "@/lib/format";

export function NotesBox({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  const [status, setStatus] = useState("");
  return (
    <div>
      <label htmlFor="notes" className="sr-only">Notes</label>
      <textarea id="notes" rows={5} className="input" value={text} maxLength={5000} onChange={(e) => { setText(e.target.value); setStatus(""); }} placeholder="Questions for my counselor, reminders…" />
      <div className="mt-2 flex items-center gap-2">
        <button type="button" className="btn-secondary btn-sm" onClick={async () => { setStatus("Saving…"); const r = await saveDoc("notes", { text }); setStatus(r.ok ? `Saved ${formatDate(r.savedAt, { hour: "numeric", minute: "2-digit" })}` : "Couldn't save"); }}>Save notes</button>
        <span className="text-xs text-muted" role="status">{status}</span>
      </div>
    </div>
  );
}
