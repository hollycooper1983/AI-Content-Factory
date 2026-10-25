// Customer payments for real-world services via Stripe Connect.
// Charges are created directly on each business's connected Stripe account,
// so funds go to the business; BookNoble never holds money or card data.
//
// Secrets: STRIPE_SECRET_KEY, PUBLIC_WEB_URL
import { admin, cors, currentUser, json, requireEnv } from '../_shared/supabase.ts';

async function stripe(path: string, params: Record<string, string>, account?: string) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('STRIPE_SECRET_KEY')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(account ? { 'Stripe-Account': account } : {}),
    },
    body: new URLSearchParams(params),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? 'Stripe error');
  return body;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { action, manageToken, invoiceId } = await req.json();
    const db = admin();
    const web = requireEnv('PUBLIC_WEB_URL').replace(/\/$/, '');

    // Owner: create or resume Stripe Express onboarding.
    if (action === 'connect_onboarding') {
      const user = await currentUser(req);
      if (!user) return json({ error: 'Not signed in' }, 401);
      const { data: b } = await db.from('businesses').select('id, email, stripe_account_id').eq('owner_id', user.id).single();
      if (!b) return json({ error: 'No business' }, 404);
      let account = b.stripe_account_id as string | null;
      if (!account) {
        const created = await stripe('accounts', { type: 'express', email: b.email ?? '', 'metadata[business_id]': b.id });
        account = created.id as string;
        await db.from('businesses').update({ stripe_account_id: account }).eq('id', b.id);
      }
      const link = await stripe('account_links', {
        account,
        type: 'account_onboarding',
        refresh_url: `${web}/settings`,
        return_url: `${web}/settings`,
      });
      return json({ url: link.url });
    }

    // Customer (no sign-in): deposit for a booking, identified by its secret manage token.
    if (action === 'deposit_checkout') {
      const { data: a } = await db
        .from('appointments')
        .select('id, deposit_cents, deposit_status, manage_token, business_id, services(name), businesses(name, currency, stripe_account_id, slug)')
        .eq('manage_token', manageToken)
        .single();
      // deno-lint-ignore no-explicit-any
      const biz = (a as any)?.businesses;
      if (!a || a.deposit_status !== 'due' || !biz?.stripe_account_id) return json({ error: 'No deposit due' }, 400);
      const session = await stripe(
        'checkout/sessions',
        {
          mode: 'payment',
          'line_items[0][quantity]': '1',
          'line_items[0][price_data][currency]': (biz.currency ?? 'usd').toLowerCase(),
          'line_items[0][price_data][unit_amount]': String(a.deposit_cents),
          // deno-lint-ignore no-explicit-any
          'line_items[0][price_data][product_data][name]': `Deposit — ${(a as any).services?.name ?? 'Appointment'} with ${biz.name}`,
          'metadata[kind]': 'deposit',
          'metadata[appointment_id]': a.id,
          success_url: `${web}/manage/${a.manage_token}?paid=1`,
          cancel_url: `${web}/manage/${a.manage_token}`,
        },
        biz.stripe_account_id,
      );
      return json({ url: session.url });
    }

    // Owner: payment link for an invoice.
    if (action === 'invoice_checkout') {
      const user = await currentUser(req);
      if (!user) return json({ error: 'Not signed in' }, 401);
      const { data: inv } = await db
        .from('invoices')
        .select('id, number, lines, tax_rate_bps, status, businesses!inner(owner_id, name, currency, stripe_account_id)')
        .eq('id', invoiceId)
        .single();
      // deno-lint-ignore no-explicit-any
      const biz = (inv as any)?.businesses;
      if (!inv || biz.owner_id !== user.id) return json({ error: 'Not found' }, 404);
      if (!biz.stripe_account_id) return json({ error: 'Connect Stripe first' }, 400);
      const subtotal = (inv.lines as { quantity: number; unitCents: number }[]).reduce((s, l) => s + Math.round(l.quantity * l.unitCents), 0);
      const total = subtotal + Math.round((subtotal * inv.tax_rate_bps) / 10000);
      const session = await stripe(
        'checkout/sessions',
        {
          mode: 'payment',
          'line_items[0][quantity]': '1',
          'line_items[0][price_data][currency]': (biz.currency ?? 'usd').toLowerCase(),
          'line_items[0][price_data][unit_amount]': String(total),
          'line_items[0][price_data][product_data][name]': `Invoice ${inv.number} — ${biz.name}`,
          'metadata[kind]': 'invoice',
          'metadata[invoice_id]': inv.id,
          success_url: `${web}/paid`,
          cancel_url: `${web}/`,
        },
        biz.stripe_account_id,
      );
      await db.from('invoices').update({ payment_url: session.url }).eq('id', inv.id);
      return json({ url: session.url });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error' }, 500);
  }
});
