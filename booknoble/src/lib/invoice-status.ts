import type { BadgeTone } from '@/components/ui';
import type { InvoiceStatus } from './types';

export const INVOICE_TONE: Record<InvoiceStatus, BadgeTone> = { draft: 'neutral', sent: 'warning', paid: 'success', void: 'neutral' };
export const INVOICE_LABEL: Record<InvoiceStatus, string> = { draft: 'Draft', sent: 'Awaiting payment', paid: 'Paid', void: 'Void' };
