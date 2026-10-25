// Sends due booking reminders. Run every 15 minutes (Supabase Cron → HTTP
// request with header `x-cron-secret`). Each reminder is logged so it is
// never sent twice.
//
// Secrets: CRON_SECRET, PUBLIC_WEB_URL, and at least one provider:
//   email — RESEND_API_KEY, REMINDER_FROM_EMAIL
//   sms   — TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
import { admin, json, requireEnv } from '../_shared/supabase.ts';

const WINDOW_MIN = 15;

function when(iso: string, tz: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

async function sendEmail(to: string, subject: string, text: string) {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: requireEnv('REMINDER_FROM_EMAIL'), to, subject, text }),
  });
  return res.ok;
}

async function sendSms(to: string, body: string) {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const tok = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!sid || !tok) return false;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${sid}:${tok}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: requireEnv('TWILIO_FROM_NUMBER'), Body: body }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== requireEnv('CRON_SECRET')) return json({ error: 'Forbidden' }, 403);
  const db = admin();
  const web = requireEnv('PUBLIC_WEB_URL').replace(/\/$/, '');
  const now = Date.now();
  let sent = 0;

  const { data: settings } = await db
    .from('reminder_settings')
    .select('business_id, channels, offsets_hours, template, businesses!inner(name, timezone, plan)')
    .eq('enabled', true)
    .neq('businesses.plan', 'free');

  for (const s of settings ?? []) {
    // deno-lint-ignore no-explicit-any
    const biz = (s as any).businesses;
    for (const h of s.offsets_hours as number[]) {
      const from = new Date(now + h * 3_600_000).toISOString();
      const to = new Date(now + h * 3_600_000 + WINDOW_MIN * 60_000).toISOString();
      const { data: appts } = await db
        .from('appointments')
        .select('id, starts_at, manage_token, clients(name, email, phone), services(name)')
        .eq('business_id', s.business_id)
        .in('status', ['confirmed', 'pending'])
        .gte('starts_at', from)
        .lt('starts_at', to);
      for (const a of appts ?? []) {
        // deno-lint-ignore no-explicit-any
        const c = (a as any).clients;
        // deno-lint-ignore no-explicit-any
        const serviceName = (a as any).services?.name ?? 'appointment';
        const text = (s.template as string)
          .replaceAll('{client}', (c?.name ?? '').split(' ')[0])
          .replaceAll('{service}', serviceName)
          .replaceAll('{business}', biz.name)
          .replaceAll('{when}', when(a.starts_at, biz.timezone))
          .replaceAll('{manage_link}', `${web}/manage/${a.manage_token}`);
        for (const channel of s.channels as string[]) {
          const { error: dup } = await db.from('reminder_log').insert({ appointment_id: a.id, offset_hours: h, channel });
          if (dup) continue; // already sent
          const ok =
            channel === 'email' && c?.email
              ? await sendEmail(c.email, `Reminder: ${biz.name}`, text)
              : channel === 'sms' && c?.phone
                ? await sendSms(c.phone, text)
                : false;
          if (ok) sent++;
          else await db.from('reminder_log').delete().match({ appointment_id: a.id, offset_hours: h, channel });
        }
      }
    }
  }
  return json({ sent });
});
