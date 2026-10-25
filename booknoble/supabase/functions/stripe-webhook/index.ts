// Marks deposits and invoices paid when Stripe Checkout completes.
// Register as a Connect webhook (events from connected accounts) for
// checkout.session.completed. Secrets: STRIPE_WEBHOOK_SECRET
import { admin, json, requireEnv } from '../_shared/supabase.ts';

async function verify(payload: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const t = parts.t;
  const sigs = header
    .split(',')
    .filter((p) => p.startsWith('v1='))
    .map((p) => p.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`));
  const hex = Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, '0')).join('');
  return sigs.some((s) => s.length === hex.length && s.split('').every((c, i) => c === hex[i]));
}

Deno.serve(async (req) => {
  const payload = await req.text();
  if (!(await verify(payload, req.headers.get('stripe-signature'), requireEnv('STRIPE_WEBHOOK_SECRET')))) {
    return json({ error: 'Bad signature' }, 400);
  }
  const event = JSON.parse(payload);
  if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') {
    const meta = event.data.object.metadata ?? {};
    const db = admin();
    if (meta.kind === 'deposit' && meta.appointment_id) {
      await db.from('appointments').update({ deposit_status: 'paid' }).eq('id', meta.appointment_id);
    }
    if (meta.kind === 'invoice' && meta.invoice_id) {
      await db.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', meta.invoice_id);
    }
  }
  return json({ received: true });
});
