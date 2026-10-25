import { repo } from './data';
import { SupabaseRepository } from './data/supabase';

/**
 * Customer payments for real-world services (deposits, invoices) go through
 * Stripe Connect, created server-side on the business's own Stripe account.
 * BookNoble never sees or stores card numbers and never holds funds.
 */
export function paymentsAvailable(): boolean {
  return repo instanceof SupabaseRepository;
}

export async function createInvoicePaymentLink(invoiceId: string): Promise<string | null> {
  if (!(repo instanceof SupabaseRepository)) return null;
  const { data, error } = await repo.client.functions.invoke('payments', { body: { action: 'invoice_checkout', invoiceId } });
  if (error) throw new Error('Payments are not set up yet. Connect Stripe in Settings → Payments.');
  return (data as { url?: string } | null)?.url ?? null;
}

export async function startStripeOnboarding(): Promise<string | null> {
  if (!(repo instanceof SupabaseRepository)) return null;
  const { data, error } = await repo.client.functions.invoke('payments', { body: { action: 'connect_onboarding' } });
  if (error) throw new Error('Could not start Stripe onboarding. Check the payments function configuration.');
  return (data as { url?: string } | null)?.url ?? null;
}
