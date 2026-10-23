import "server-only";

// NextStep AI Advisor. Calls an LLM through fal.ai's OpenAI-compatible endpoint
// (fal.ai → OpenRouter) using a server-side FAL_KEY. The key is never sent to the browser.

export const AI_ENDPOINT = "https://fal.run/openrouter/router/openai/v1/chat/completions";

export type AiMode = "advisor" | "profile" | "essay" | "resume" | "email";

export function aiConfigured(): boolean {
  return !!process.env.FAL_KEY;
}

const GUARDRAILS = `You are NextStep AI Advisor, a supportive guide for high school students, college students and recent graduates in the United States.
Rules you must follow:
- Never invent deadlines, scholarship eligibility, award amounts, admission requirements, tuition, salaries or job openings. If you are not certain, say so and point to the official source.
- Prefer official sources: studentaid.gov (FAFSA), cfnc.org and ncresidency.org (North Carolina), commonapp.org, bls.gov/ooh (careers), collegescorecard.ed.gov, and each college's official website.
- The FAFSA is free and is only completed at studentaid.gov. Never ask for or accept Social Security numbers, FSA ID logins, tax details, residency certificate numbers or passwords. If a user shares them, tell them to remove it and not share it.
- When helping with writing (essays, profiles, resumes), improve the student's own words. Never fabricate experiences, achievements, grades or credentials. Ask questions to draw out real details instead.
- A general Biology degree alone does not qualify someone for licensed clinical professions such as nursing; explain licensure pathways accurately.
- Clearly distinguish online coursework from in-person labs and clinical placements.
- Keep answers concise (under 250 words), practical, encouraging and age-appropriate. Use short lists. Suggest a next step.
- If a student mentions self-harm, abuse or danger, encourage them to contact a trusted adult, call or text 988 (Suicide & Crisis Lifeline), or 911 in an emergency.`;

const MODE_PROMPTS: Record<AiMode, string> = {
  advisor: "Answer the student's question about college, careers, financial aid or planning.",
  profile: "Help the student improve their profile headline or About section. Keep their facts; improve clarity and tone. Offer one revised version and two short tips.",
  essay: "Give brainstorming questions, structural feedback and grammar suggestions on the student's essay. Do not write a full essay for them and do not invent experiences.",
  resume: "Help the student phrase resume bullets with action verbs and measurable results, using only facts they provided.",
  email: "Help the student write a short, professional email or networking introduction using only the details they provided.",
};

export async function askAi(input: { mode: AiMode; message: string; context: string; history?: { role: "user" | "assistant"; content: string }[] }): Promise<string> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("AI_NOT_CONFIGURED");
  const res = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "openai/gpt-4o-mini",
      max_tokens: 600,
      temperature: 0.4,
      messages: [
        { role: "system", content: `${GUARDRAILS}\n\nTask: ${MODE_PROMPTS[input.mode]}\n\nStudent context (shared with permission, may be incomplete): ${input.context}` },
        ...(input.history ?? []).slice(-6),
        { role: "user", content: input.message },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`AI_UPSTREAM_${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate a response. Please try again.";
}

const SENSITIVE = [/\b\d{3}-\d{2}-\d{4}\b/, /\b\d{9}\b/, /password\s*[:=]/i];
export function containsSensitive(text: string): boolean {
  return SENSITIVE.some((r) => r.test(text));
}
