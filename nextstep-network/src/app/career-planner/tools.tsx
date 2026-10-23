"use client";

import Link from "next/link";
import { useState } from "react";
import { saveDoc } from "@/app/actions/planning";
import { WritingAssist } from "@/components/ai-advisor";
import { cn } from "@/lib/format";

const QUIZ: { q: string; a: [string, string][] }[] = [
  { q: "Which activity sounds most fun?", a: [["Helping someone feel better", "Healthcare"], ["Running an experiment", "Science"], ["Building an app or website", "Technology"], ["Designing a machine", "Engineering"], ["Organizing a team or event", "Business"]] },
  { q: "Pick a class you enjoy:", a: [["Anatomy / Health", "Healthcare"], ["Biology / Chemistry", "Science"], ["Computer Science", "Technology"], ["Physics / Math", "Engineering"], ["Economics / Marketing", "Business"]] },
  { q: "Your ideal work setting:", a: [["Hospital or clinic", "Healthcare"], ["Lab or outdoors", "Science"], ["Remote or office with tech", "Technology"], ["Workshop or plant", "Engineering"], ["Office with lots of people", "Business"]] },
  { q: "What problem would you solve?", a: [["Improve patient care", "Healthcare"], ["Understand disease or nature", "Science"], ["Make tools people use daily", "Technology"], ["Make energy or transport better", "Engineering"], ["Grow an organization", "Business"]] },
];

const SKILLS = ["Communication", "Teamwork", "Problem solving", "Leadership", "Time management", "Writing", "Public speaking", "Data analysis", "Lab techniques", "Programming", "Customer service", "Bilingual", "Research", "Creativity", "Attention to detail"];
const DEV = ["Create a professional email address", "Complete your NextStep profile", "Build a one-page resume", "Ask a teacher or counselor to be a reference", "Do an informational interview", "Attend a career fair or workshop", "Volunteer or job shadow in your field", "Practice interview answers out loud"];
const QUESTIONS = ["Tell me about yourself.", "Why are you interested in this internship?", "Describe a time you worked on a team.", "Tell me about a challenge you overcame.", "What is one of your strengths, and one area you're improving?", "Where do you see yourself in five years?"];

type Data = { quiz?: Record<number, string>; skills?: string[]; dev?: string[]; goals?: string };

export function CareerTools({ initial }: { initial: Data }) {
  const [tab, setTab] = useState("assessment");
  const [data, setData] = useState<Data>(initial);
  const [status, setStatus] = useState("");
  const [cover, setCover] = useState({ role: "", org: "", why: "", exp: "" });
  const [answer, setAnswer] = useState("");
  const [qi, setQi] = useState(0);
  const [email, setEmail] = useState({ to: "", purpose: "", details: "" });
  const save = async (next: Data) => { setData(next); setStatus("Saving…"); const r = await saveDoc("passport", next); setStatus(r.ok ? "Saved" : "Couldn't save"); };
  const tally: Record<string, number> = {};
  Object.values(data.quiz ?? {}).forEach((c) => (tally[c] = (tally[c] ?? 0) + 1));
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const tabs = [["assessment", "Interest assessment"], ["skills", "Skills inventory"], ["dev", "Development checklist"], ["cover", "Cover letter builder"], ["interview", "Interview practice"], ["email", "Email & networking intro"], ["passport", "Opportunity Passport"]];
  const coverText = `Dear Hiring Team at ${cover.org || "[Organization]"},\n\nI'm excited to apply for the ${cover.role || "[Role]"} position. ${cover.why}\n\n${cover.exp}\n\nThank you for considering my application. I'd welcome the chance to discuss how I can contribute.\n\nSincerely,\n[Your name]`;
  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <nav className="card h-fit p-2" aria-label="Career tools">
        {tabs.map(([k, l]) => <button key={k} type="button" onClick={() => setTab(k)} aria-current={tab === k} className={cn("block w-full rounded-lg px-3 py-2 text-left text-sm", tab === k ? "bg-brand-50 font-semibold text-brand dark:bg-brand/10" : "hover:bg-canvas")}>{l}</button>)}
        <p className="px-3 py-2 text-xs text-muted" role="status">{status}</p>
      </nav>
      <section className="card p-5">
        {tab === "assessment" && (
          <div className="space-y-5">
            <div><h2 className="text-lg font-semibold">Career interest assessment</h2><p className="text-sm text-muted">A quick reflection tool — not a test. There are no wrong answers, and results are just ideas to explore.</p></div>
            {QUIZ.map((item, i) => (
              <fieldset key={i}><legend className="font-medium">{i + 1}. {item.q}</legend>
                <div className="mt-2 flex flex-wrap gap-2">{item.a.map(([label, cluster]) => (
                  <button key={label} type="button" aria-pressed={data.quiz?.[i] === cluster} onClick={() => save({ ...data, quiz: { ...data.quiz, [i]: cluster } })} className={cn("chip px-3 py-1.5 text-sm", data.quiz?.[i] === cluster && "border-teal bg-teal-50 text-teal-700 dark:bg-teal/15 dark:text-teal")}>{label}</button>
                ))}</div>
              </fieldset>
            ))}
            {top.length > 0 && <div className="rounded-lg bg-canvas p-4"><p className="font-semibold">Areas to explore: {top.slice(0, 2).map(([c]) => c).join(" & ")}</p><Link href={`/careers?cluster=${top[0][0]}`} className="link text-sm">See {top[0][0]} careers →</Link></div>}
          </div>
        )}
        {tab === "skills" && (
          <div><h2 className="text-lg font-semibold">Personal skills inventory</h2><p className="text-sm text-muted">Select skills you can back up with a real example.</p>
            <div className="mt-3 flex flex-wrap gap-2">{SKILLS.map((s) => { const on = data.skills?.includes(s); return <button key={s} type="button" aria-pressed={on} onClick={() => save({ ...data, skills: on ? data.skills!.filter((x) => x !== s) : [...(data.skills ?? []), s] })} className={cn("chip px-3 py-1.5 text-sm", on && "border-brand bg-brand-50 text-brand dark:bg-brand/10")}>{s}</button>; })}</div>
            <p className="mt-4 text-sm text-muted">Add these to your <Link href="/profile/edit#skills" className="link">profile</Link> and <Link href="/resume-builder" className="link">resume</Link>.</p></div>
        )}
        {tab === "dev" && (
          <div><h2 className="text-lg font-semibold">Professional development checklist</h2>
            <ul className="mt-3 space-y-2">{DEV.map((d) => { const on = data.dev?.includes(d); return <li key={d}><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!on} onChange={() => save({ ...data, dev: on ? data.dev!.filter((x) => x !== d) : [...(data.dev ?? []), d] })} /> {d}</label></li>; })}</ul>
            <p className="mt-3 text-sm font-semibold">{data.dev?.length ?? 0} of {DEV.length} complete</p></div>
        )}
        {tab === "cover" && (
          <div className="space-y-3"><h2 className="text-lg font-semibold">Cover letter builder</h2>
            <div className="grid gap-2 sm:grid-cols-2"><input className="input" placeholder="Role" aria-label="Role" value={cover.role} onChange={(e) => setCover({ ...cover, role: e.target.value })} /><input className="input" placeholder="Organization" aria-label="Organization" value={cover.org} onChange={(e) => setCover({ ...cover, org: e.target.value })} /></div>
            <textarea className="input" rows={3} placeholder="Why this role? (your real reasons)" aria-label="Why" value={cover.why} onChange={(e) => setCover({ ...cover, why: e.target.value })} />
            <textarea className="input" rows={3} placeholder="Relevant experience, classes or projects (only real ones)" aria-label="Experience" value={cover.exp} onChange={(e) => setCover({ ...cover, exp: e.target.value })} />
            <pre className="whitespace-pre-wrap rounded-lg bg-canvas p-4 font-sans text-sm">{coverText}</pre>
            <div className="flex flex-wrap gap-2"><button type="button" className="btn-secondary btn-sm" onClick={() => navigator.clipboard.writeText(coverText)}>Copy</button></div>
            <WritingAssist mode="email" getText={() => coverText} label="Polish with AI" />
          </div>
        )}
        {tab === "interview" && (
          <div className="space-y-3"><h2 className="text-lg font-semibold">Interview practice</h2>
            <p className="rounded-lg bg-navy p-4 text-white">“{QUESTIONS[qi]}”</p>
            <textarea className="input" rows={5} placeholder="Type your answer. Try the STAR method: Situation, Task, Action, Result." aria-label="Your answer" value={answer} onChange={(e) => setAnswer(e.target.value)} />
            <div className="flex flex-wrap gap-2"><button type="button" className="btn-ghost btn-sm" onClick={() => { setQi((qi + 1) % QUESTIONS.length); setAnswer(""); }}>Next question</button></div>
            <WritingAssist mode="advisor" getText={() => answer && `Interview practice. Question: "${QUESTIONS[qi]}". My answer: "${answer}". Give brief, encouraging feedback on structure and clarity without inventing details.`} label="Get AI feedback" />
          </div>
        )}
        {tab === "email" && (
          <div className="space-y-3"><h2 className="text-lg font-semibold">Professional email & networking introduction</h2>
            <input className="input" placeholder="Who is it to? (e.g. a professor, recruiter, mentor)" aria-label="Recipient" value={email.to} onChange={(e) => setEmail({ ...email, to: e.target.value })} />
            <input className="input" placeholder="Purpose (e.g. ask about research, follow up after career fair)" aria-label="Purpose" value={email.purpose} onChange={(e) => setEmail({ ...email, purpose: e.target.value })} />
            <textarea className="input" rows={3} placeholder="Key details about you (school, interests, how you met)" aria-label="Details" value={email.details} onChange={(e) => setEmail({ ...email, details: e.target.value })} />
            <WritingAssist mode="email" getText={() => email.purpose && `Write a short professional email to ${email.to}. Purpose: ${email.purpose}. Details: ${email.details}`} label="Draft with AI" />
            <p className="text-xs text-muted">Tip: subject line, polite greeting, one clear ask, thank-you, and a signature with your name and school.</p>
          </div>
        )}
        {tab === "passport" && (
          <div className="space-y-3"><h2 className="text-lg font-semibold">Student Opportunity Passport</h2>
            <p className="text-sm text-muted">A private, reusable summary of your interests, skills and goals. Only you can see it.</p>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-lg bg-canvas p-3"><p className="font-semibold">Interest areas</p><p className="text-muted">{top.map(([c]) => c).join(", ") || "Take the assessment"}</p></div>
              <div className="rounded-lg bg-canvas p-3"><p className="font-semibold">Skills</p><p className="text-muted">{data.skills?.join(", ") || "Complete the skills inventory"}</p></div>
            </div>
            <label htmlFor="goals" className="label">Career goals</label>
            <textarea id="goals" className="input" rows={4} defaultValue={data.goals} onBlur={(e) => save({ ...data, goals: e.target.value })} placeholder="What do you want to do in the next 1–5 years?" />
            <p className="text-xs text-muted">Achievements, projects and volunteer experience come from your <Link href="/profile" className="link">profile</Link>.</p>
          </div>
        )}
      </section>
    </div>
  );
}
