import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { aiConfigured, askAi, containsSensitive } from "@/lib/ai";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  mode: z.enum(["advisor", "profile", "essay", "resume", "email"]).default("advisor"),
  message: z.string().trim().min(1).max(6000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(10).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to use NextStep AI Advisor." }, { status: 401 });
  if (!aiConfigured()) {
    return NextResponse.json({ error: "NextStep AI Advisor isn't set up yet. An administrator needs to add a FAL_KEY environment variable. Everything else on the site works without it.", setup: true }, { status: 503 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (containsSensitive(parsed.data.message)) {
    return NextResponse.json({ error: "It looks like your message includes a Social Security number, ID number or password. Please remove it — NextStep never needs that information." }, { status: 400 });
  }
  if (!rateLimit(`ai:${user.id}`, 6, 60_000).ok) return NextResponse.json({ error: "Slow down a little — try again in a minute." }, { status: 429 });

  const store = await db();
  const dayKey = new Date().toISOString().slice(0, 10);
  const limit = Number(process.env.AI_DAILY_LIMIT || 20);
  const usage = await store.find("ai_usage", { userId: user.id, day: dayKey });
  if (usage && usage.count >= limit) return NextResponse.json({ error: `You've reached today's limit of ${limit} AI requests. It resets tomorrow.` }, { status: 429 });

  const p = await store.find("profiles", { userId: user.id });
  const context = p
    ? `Role: ${user.role}. Under 18: ${user.ageGroup === "minor" ? "yes" : "no"}. School level: ${p.schoolLevel}. Graduation year: ${p.gradYear ?? "unknown"}. State: ${p.state || "unknown"}. Career interests: ${p.careerInterests.join(", ") || "none listed"}. Preferred learning format: ${p.learningFormat || "unspecified"}.`
    : `Role: ${user.role}.`;

  try {
    const reply = await askAi({ mode: parsed.data.mode, message: parsed.data.message, history: parsed.data.history, context });
    if (usage) await store.update("ai_usage", usage.id, { count: usage.count + 1 });
    else await store.insert("ai_usage", { userId: user.id, day: dayKey, count: 1 });
    return NextResponse.json({ reply, remaining: limit - ((usage?.count ?? 0) + 1) });
  } catch (e) {
    console.error("[ai]", (e as Error).message);
    return NextResponse.json({ error: "The AI service is unavailable right now. Please try again later." }, { status: 502 });
  }
}
