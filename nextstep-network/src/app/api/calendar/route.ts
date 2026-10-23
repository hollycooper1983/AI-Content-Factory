import { getCurrentUser } from "@/lib/auth";
import { calendarItems } from "@/lib/calendar";
import { buildIcs } from "@/lib/ics";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in required", { status: 401 });
  const items = (await calendarItems(user.id)).filter((i) => !i.done);
  const body = buildIcs(items.map((i) => ({ uid: i.id, title: i.title, date: i.date, description: "From your NextStep Network calendar. Confirm dates with the official source." })));
  return new Response(body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="nextstep-deadlines.ics"', "Cache-Control": "no-store" } });
}
