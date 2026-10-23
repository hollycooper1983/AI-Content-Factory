"use client";

import { useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Plus } from "lucide-react";
import { saveProfile } from "@/app/actions/planning";
import { FormMessage, SubmitButton } from "@/components/client-ui";
import { WritingAssist } from "@/components/ai-advisor";
import type { Entry, Profile } from "@/lib/types";

const INTERESTS = ["Biology", "Healthcare", "Nursing", "Research", "Engineering", "Technology", "Business", "Education", "Law", "Arts", "Environmental Science", "Public Service"];

function EntryList({ id, title, prefix, initial, hint }: { id: string; title: string; prefix: string; initial: Entry[]; hint?: string }) {
  const [rows, setRows] = useState<Entry[]>(initial.length ? initial : []);
  return (
    <fieldset id={id} className="card scroll-mt-20 p-5">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {rows.length < 10 && <button type="button" className="btn-ghost btn-sm" onClick={() => setRows([...rows, { title: "" }])}><Plus className="h-4 w-4" /> Add</button>}
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {rows.length === 0 && <p className="mt-3 text-sm text-muted">Nothing added yet.</p>}
      <div className="mt-3 space-y-4">
        {rows.map((r, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-2">
            <input name={`${prefix}_${i}_title`} defaultValue={r.title} placeholder="Title (e.g. Volunteer Tutor)" aria-label={`${title} ${i + 1} title`} className="input sm:col-span-2" />
            <input name={`${prefix}_${i}_org`} defaultValue={r.org} placeholder="Organization / school" aria-label="Organization" className="input sm:col-span-2" />
            <input name={`${prefix}_${i}_start`} defaultValue={r.start} placeholder="Start (e.g. 2025)" aria-label="Start" className="input" />
            <input name={`${prefix}_${i}_end`} defaultValue={r.end} placeholder="End (or Present)" aria-label="End" className="input" />
            <textarea name={`${prefix}_${i}_description`} defaultValue={r.description} rows={2} placeholder="What did you do or learn?" aria-label="Description" className="input sm:col-span-2" />
            <button type="button" className="btn-ghost btn-sm justify-self-start text-red-600" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function ProfileForm({ profile, name, isMinor }: { profile: Profile; name: string; isMinor: boolean }) {
  const [state, action] = useFormState(saveProfile, undefined);
  const about = useRef<HTMLTextAreaElement>(null);
  const headline = useRef<HTMLInputElement>(null);
  const [interests, setInterests] = useState(profile.careerInterests.join(", "));
  const toggle = (i: string) => {
    const cur = interests.split(",").map((s) => s.trim()).filter(Boolean);
    setInterests((cur.includes(i) ? cur.filter((c) => c !== i) : [...cur, i]).join(", "));
  };
  return (
    <form action={action} className="space-y-4">
      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label" htmlFor="name">Display name</label><input id="name" name="name" defaultValue={name} className="input" /></div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="headline">Professional headline</label>
            <input ref={headline} id="headline" name="headline" defaultValue={profile.headline} maxLength={160} placeholder="Future Biology Student | Class of 2027 | Interested in Healthcare" className="input" />
          </div>
          <div><label className="label" htmlFor="school">Current school</label><input id="school" name="school" defaultValue={profile.school} className="input" /></div>
          <div>
            <label className="label" htmlFor="schoolLevel">School level</label>
            <select id="schoolLevel" name="schoolLevel" defaultValue={profile.schoolLevel} className="input">
              <option value="high_school">High school</option><option value="community_college">Community college</option><option value="university">University</option>
              <option value="trade_school">Trade school</option><option value="graduate">Recent graduate</option><option value="other">Other</option>
            </select>
          </div>
          <div><label className="label" htmlFor="gradYear">Expected graduation year</label><input id="gradYear" name="gradYear" type="number" min={2000} max={2040} defaultValue={profile.gradYear ?? ""} className="input" /></div>
          <div>
            <label className="label" htmlFor="learningFormat">Preferred learning format</label>
            <select id="learningFormat" name="learningFormat" defaultValue={profile.learningFormat ?? ""} className="input">
              <option value="">No preference</option><option value="online">Online</option><option value="hybrid">Hybrid</option><option value="on_campus">On campus</option>
            </select>
          </div>
          <div><label className="label" htmlFor="city">City</label><input id="city" name="city" defaultValue={profile.city} className="input" /></div>
          <div><label className="label" htmlFor="state">State (2 letters)</label><input id="state" name="state" maxLength={2} defaultValue={profile.state} className="input uppercase" /></div>
        </div>
        <p className="text-xs text-muted">We never show your exact birthday, home address, phone number or financial aid details on your profile.</p>
      </section>

      <section id="about" className="card scroll-mt-20 space-y-3 p-5">
        <h2 className="font-semibold">About</h2>
        <label htmlFor="about-text" className="sr-only">About</label>
        <textarea ref={about} id="about-text" name="about" rows={6} maxLength={2600} defaultValue={profile.about} placeholder="Tell people about your goals, interests and what you're working on." className="input" />
        <WritingAssist mode="profile" getText={() => `Headline: ${headline.current?.value}\nAbout: ${about.current?.value}`} label="Suggest improvements with AI" />
      </section>

      <section id="skills" className="card scroll-mt-20 space-y-4 p-5">
        <div>
          <h2 className="font-semibold">Career interests</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((i) => {
              const on = interests.split(",").map((s) => s.trim()).includes(i);
              return <button type="button" key={i} aria-pressed={on} onClick={() => toggle(i)} className={on ? "chip border-teal bg-teal-50 text-teal-700 dark:bg-teal/15 dark:text-teal" : "chip hover:border-brand"}>{i}</button>;
            })}
          </div>
          <label htmlFor="careerInterests" className="label mt-3">Interests (comma-separated)</label>
          <input id="careerInterests" name="careerInterests" value={interests} onChange={(e) => setInterests(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="skillsInput" className="label">Skills (comma-separated)</label>
          <input id="skillsInput" name="skills" defaultValue={profile.skills.join(", ")} placeholder="Biology, Excel, Public Speaking" className="input" />
        </div>
      </section>

      <EntryList id="education" title="Education" prefix="education" initial={profile.education} />
      <EntryList id="experience" title="Work & internship experience" prefix="experience" initial={profile.experience} />
      <EntryList id="projects" title="Academic projects" prefix="projects" initial={profile.projects} />
      <EntryList id="volunteer" title="Volunteer experience" prefix="volunteer" initial={profile.volunteer} />
      <EntryList id="activities" title="Extracurricular activities" prefix="activities" initial={profile.activities} />
      <EntryList id="awards" title="Awards & accomplishments" prefix="awards" initial={profile.awards} />
      <EntryList id="certifications" title="Certifications" prefix="certifications" initial={profile.certifications} hint="Only list certifications you've actually earned." />

      <section id="links" className="card scroll-mt-20 space-y-3 p-5">
        <h2 className="font-semibold">Photos & portfolio links</h2>
        <div><label className="label" htmlFor="avatarUrl">Profile photo URL (https)</label><input id="avatarUrl" name="avatarUrl" type="url" defaultValue={profile.avatarUrl} className="input" /></div>
        <div><label className="label" htmlFor="bannerUrl">Cover photo URL (https)</label><input id="bannerUrl" name="bannerUrl" type="url" defaultValue={profile.bannerUrl} className="input" /></div>
        <p className="text-xs text-muted">Direct photo uploads arrive when file storage (e.g. Supabase Storage) is connected.</p>
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[160px_1fr]">
            <input name={`link_${i}_label`} defaultValue={profile.links[i]?.label} placeholder="Label" aria-label={`Link ${i + 1} label`} className="input" />
            <input name={`link_${i}_url`} type="url" defaultValue={profile.links[i]?.url} placeholder="https://" aria-label={`Link ${i + 1} URL`} className="input" />
          </div>
        ))}
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Who can see your profile</h2>
        {[
          ["public", "All signed-in members", isMinor ? "Not available for members under 18" : "Students, mentors and organizations can view your profile"],
          ["network", "Connections only", "Only people you've connected with"],
          ["private", "Only me", "Hidden from everyone except you (and a parent you invite)"],
        ].map(([v, l, d]) => (
          <label key={v} className="flex gap-2 text-sm">
            <input type="radio" name="visibility" value={v} defaultChecked={profile.visibility === v} disabled={isMinor && v === "public"} className="mt-1" />
            <span><span className="font-medium">{l}</span><span className="block text-xs text-muted">{d}</span></span>
          </label>
        ))}
      </section>

      <div className="sticky bottom-20 z-10 flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-lg lg:bottom-4">
        <SubmitButton>Save profile</SubmitButton>
        <a href="/profile" className="btn-ghost">Cancel</a>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
