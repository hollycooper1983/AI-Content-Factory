import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/** Exports everything stored about the signed-in member (data portability). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in required", { status: 401 });
  const store = await db();
  const own = ["profiles", "saved_items", "college_applications", "fafsa_progress", "aid_offers", "scholarship_applications", "job_applications", "tasks", "essays", "courses", "user_docs", "notifications", "notification_prefs", "group_members", "follows", "reactions"] as const;
  const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), account: user };
  for (const t of own) out[t] = await store.all(t, { userId: user.id } as never);
  out.posts = await store.all("posts", { authorId: user.id });
  out.comments = await store.all("comments", { authorId: user.id });
  out.connections = [...(await store.all("connections", { requesterId: user.id })), ...(await store.all("connections", { addresseeId: user.id }))];
  const convs = (await store.all("conversations")).filter((c) => c.participantIds.includes(user.id));
  out.messagesSent = (await store.all("messages", { senderId: user.id })).filter((m) => convs.some((c) => c.id === m.conversationId));
  return new Response(JSON.stringify(out, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="nextstep-my-data.json"', "Cache-Control": "no-store" } });
}
