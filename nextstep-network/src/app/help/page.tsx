import type { Metadata } from "next";
import { Card, ExternalLink, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Help Center" };

const FAQ = [
  ["Does NextStep submit my college applications?", "No. We help you organize applications and link to official application sites like CFNC, Common App and each college's portal."],
  ["Is the FAFSA done on NextStep?", "No. The FAFSA is free and completed only at StudentAid.gov. Our checklist helps you track your progress without collecting sensitive information."],
  ["Why can't I send messages?", "Direct messaging is turned off for members under 18 in this release while supervised youth messaging is built. Adults can message accepted connections."],
  ["How do I reset my password?", "Password reset by email will be available once an email provider is configured. Until then, signed-in members can change their password in Settings; contact an administrator if you're locked out."],
  ["How do I delete my account or download my data?", "Go to Settings → Your data. You can export your data as a JSON file or permanently delete your account."],
  ["How are colleges and scholarships verified?", "Administrators confirm details against official sources (College Scorecard, sponsor websites) and record the source and date. Unverified records are clearly labeled."],
];

export default function Help() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <PageHeader eyebrow="Help Center" title="How can we help?" />
      <Card className="divide-y divide-line">
        {FAQ.map(([q, a]) => <details key={q} className="group p-4"><summary className="cursor-pointer font-medium">{q}</summary><p className="mt-2 text-sm text-muted">{a}</p></details>)}
      </Card>
      <Card className="scroll-mt-20 p-6" id="safety">
        <h2 className="text-lg font-semibold">Student safety</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Profiles for members under 18 are private by default and can never be public.</li>
          <li>Adults can't send connection requests to members under 18. Minors can connect with other students under 18 and verified mentors and counselors only.</li>
          <li>Direct messaging is disabled for members under 18.</li>
          <li>Employers, colleges, counselors and mentors are verified before receiving elevated privileges.</li>
          <li>Every post, comment, listing and profile can be reported. You can block anyone.</li>
          <li>In an emergency, call 911. For mental health support, call or text <ExternalLink href="https://988lifeline.org/">988</ExternalLink>.</li>
        </ul>
      </Card>
      <Card className="scroll-mt-20 p-6" id="privacy">
        <h2 className="text-lg font-semibold">Privacy</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>We collect only what's needed: name, email, password (stored as a salted hash), role and age range — not your birth date, SSN or home address.</li>
          <li>Planning data (applications, FAFSA progress, residency status, essays, notes) is private to you, plus read-only checklist access for a parent you invite.</li>
          <li>Employers never see your private academic records.</li>
          <li>We don't sell student data. You can export or delete your data anytime in Settings.</li>
          <li>AI Advisor requests are sent to our AI provider (fal.ai) to generate a response, with limited profile context (school level, interests, state). Don't include sensitive personal information.</li>
        </ul>
        <p className="mt-3 text-xs text-muted">This is a preview release. Before a public launch, the operator must review COPPA, FERPA (where applicable), state student privacy laws and child online safety obligations with qualified counsel. Technical safeguards alone don't establish legal compliance.</p>
      </Card>
      <Card className="scroll-mt-20 p-6" id="guidelines">
        <h2 className="text-lg font-semibold">Community guidelines</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Be respectful, supportive and professional.</li><li>No harassment, hate, bullying or sexual content.</li><li>No spam, scams, or paid “services” targeting students.</li>
          <li>Don't share anyone's private information, including your own phone number, address or ID numbers.</li><li>Share accurate information and cite official sources.</li><li>Report anything that seems unsafe.</li>
        </ol>
      </Card>
    </div>
  );
}
