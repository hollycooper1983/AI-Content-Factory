import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Share, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Badge, Button, Card, Chip, Divider, Field, IconButton, LoadingList, SectionHeader, Text } from '@/components/ui';
import { UpgradeGate } from '@/components/upgrade-gate';
import { repo } from '@/lib/data';
import { addDays, formatLocalDate, todayIn } from '@/lib/scheduling';
import { confirm, errorMessage, notify } from '@/lib/dialogs';
import { INVOICE_LABEL, INVOICE_TONE } from '@/lib/invoice-status';
import { centsToInput, formatMoneyExact, invoiceTotals, parseMoney } from '@/lib/money';
import { createInvoicePaymentLink, paymentsAvailable } from '@/lib/payments';
import type { Client, Invoice } from '@/lib/types';
import { useBusiness } from '@/providers/app-provider';
import { space } from '@/theme/tokens';

interface LineDraft {
  description: string;
  quantity: string;
  unit: string;
}

export default function InvoiceEditor() {
  const { id, appointment } = useLocalSearchParams<{ id: string; appointment?: string }>();
  const business = useBusiness();
  const isNew = id === 'new';
  const [inv, setInv] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[] | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [lines, setLines] = useState<LineDraft[]>([{ description: '', quantity: '1', unit: '' }]);
  const [tax, setTax] = useState('0');
  const [due, setDue] = useState(addDays(todayIn(business.timezone), 7));
  const [notes, setNotes] = useState('');
  const [appointmentId, setAppointmentId] = useState<string | null>(appointment ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setClients(await repo.listClients(business.id));
      if (!isNew) {
        const i = await repo.getInvoice(id);
        if (!i) return;
        setInv(i);
        setClientId(i.clientId);
        setLines(i.lines.map((l) => ({ description: l.description, quantity: String(l.quantity), unit: centsToInput(l.unitCents) })));
        setTax(String(i.taxRateBps / 100));
        setDue(i.dueDate);
        setNotes(i.notes);
        setAppointmentId(i.appointmentId);
      } else if (appointment) {
        const a = await repo.getAppointment(appointment);
        const services = await repo.listServices(business.id);
        if (a) {
          setClientId(a.clientId);
          const s = services.find((x) => x.id === a.serviceId);
          const lineItems: LineDraft[] = [{ description: s?.name ?? 'Service', quantity: '1', unit: centsToInput(a.priceCents) }];
          if (a.depositStatus === 'paid' && a.depositCents) {
            lineItems.push({ description: 'Deposit received', quantity: '1', unit: `-${centsToInput(a.depositCents)}` });
          }
          setLines(lineItems);
        }
      }
    })().catch((e) => setError(errorMessage(e)));
  }, [id, isNew, appointment, business.id]);

  const parsed = lines.map((l) => {
    const neg = l.unit.trim().startsWith('-');
    const cents = parseMoney(l.unit.replace('-', ''));
    return { description: l.description.trim(), quantity: Number(l.quantity) || 0, unitCents: cents === null ? NaN : neg ? -cents : cents };
  });
  const taxBps = Math.round((parseFloat(tax) || 0) * 100);
  const totals = invoiceTotals({ lines: parsed.filter((l) => !Number.isNaN(l.unitCents)), taxRateBps: taxBps });
  const locked = inv?.status === 'paid' || inv?.status === 'void';

  const persist = async (patch: Partial<Invoice> = {}) => {
    if (!clientId) throw new Error('Choose a client.');
    if (parsed.some((l) => !l.description || Number.isNaN(l.unitCents) || l.quantity <= 0)) {
      throw new Error('Each line needs a description, quantity and price.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) throw new Error('Use a due date like 2026-11-01.');
    const saved = await repo.upsertInvoice({
      ...(inv ? { id: inv.id } : {}),
      businessId: business.id,
      clientId,
      appointmentId,
      lines: parsed,
      taxRateBps: taxBps,
      dueDate: due,
      notes: notes.trim(),
      ...patch,
    });
    setInv(saved);
    return saved;
  };

  const run = async (key: string, fn: () => Promise<void>) => {
    setError(null);
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const sendRequest = () =>
    run('send', async () => {
      let saved = await persist({ status: 'sent' });
      if (paymentsAvailable()) {
        const url = await createInvoicePaymentLink(saved.id);
        if (url) saved = await repo.upsertInvoice({ id: saved.id, businessId: business.id, paymentUrl: url });
        setInv(saved);
      }
      const client = clients?.find((c) => c.id === saved.clientId);
      const message =
        `${business.name} — invoice ${saved.number}\n` +
        `Amount due: ${formatMoneyExact(invoiceTotals(saved).total, business.currency)} by ${formatLocalDate(saved.dueDate)}\n` +
        (saved.paymentUrl ? `Pay securely: ${saved.paymentUrl}` : 'Reply to arrange payment.');
      if (Platform.OS === 'web') {
        const nav = navigator as Navigator & { share?: (d: object) => Promise<void> };
        if (nav.share) await nav.share({ title: `Invoice ${saved.number}`, text: message }).catch(() => {});
        else notify('Invoice ready', message);
      } else {
        await Share.share({ message, title: `Invoice for ${client?.name ?? 'client'}` });
      }
    });

  if (!clients || (!isNew && !inv)) {
    return (
      <Screen title="Invoice">
        <LoadingList rows={4} />
      </Screen>
    );
  }

  return (
    <Screen
      title={inv ? inv.number : 'New invoice'}
      right={inv ? <Badge label={INVOICE_LABEL[inv.status]} tone={INVOICE_TONE[inv.status]} /> : null}
      footer={
        locked ? undefined : (
          <>
            {error ? <Text tone="danger">{error}</Text> : null}
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button label="Save draft" variant="secondary" style={{ flex: 1 }} loading={busy === 'save'} onPress={() => run('save', async () => void (await persist()))} />
              <Button label={inv?.status === 'sent' ? 'Resend' : 'Send request'} icon="share" style={{ flex: 1 }} loading={busy === 'send'} onPress={sendRequest} />
            </View>
          </>
        )
      }>
      <UpgradeGate feature="invoices" title="Invoice clients and get paid">
        <SectionHeader title="Bill to" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {clients.map((c) => (
            <Chip key={c.id} label={c.name} selected={c.id === clientId} onPress={() => !locked && setClientId(c.id)} />
          ))}
          {clients.length === 0 ? <Text tone="secondary">Add a client first.</Text> : null}
        </View>

        <SectionHeader title="Items" />
        {lines.map((l, i) => (
          <Card key={i} style={{ gap: space.md }}>
            <Field
              label={`Item ${i + 1}`}
              value={l.description}
              editable={!locked}
              onChangeText={(v) => setLines(lines.map((x, j) => (j === i ? { ...x, description: v } : x)))}
              placeholder="Service or product"
            />
            <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-end' }}>
              <Field label="Qty" value={l.quantity} editable={!locked} keyboardType="decimal-pad" style={{ width: 80 }} onChangeText={(v) => setLines(lines.map((x, j) => (j === i ? { ...x, quantity: v } : x)))} />
              <Field label="Price" value={l.unit} editable={!locked} keyboardType="numbers-and-punctuation" style={{ flex: 1 }} onChangeText={(v) => setLines(lines.map((x, j) => (j === i ? { ...x, unit: v } : x)))} />
              {lines.length > 1 && !locked ? (
                <IconButton icon="trash" label={`Remove item ${i + 1}`} onPress={() => setLines(lines.filter((_, j) => j !== i))} />
              ) : null}
            </View>
          </Card>
        ))}
        {locked ? null : (
          <Button label="Add item" icon="plus" variant="ghost" onPress={() => setLines([...lines, { description: '', quantity: '1', unit: '' }])} />
        )}

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Field label="Tax %" value={tax} onChangeText={setTax} editable={!locked} keyboardType="decimal-pad" style={{ width: 100 }} />
          <Field label="Due date" value={due} onChangeText={setDue} editable={!locked} autoCapitalize="none" style={{ flex: 1 }} />
        </View>
        <Field label="Note to client" value={notes} onChangeText={setNotes} editable={!locked} multiline placeholder="Thank you for your business!" />

        <Card style={{ gap: space.sm }}>
          <Row label="Subtotal" value={formatMoneyExact(totals.subtotal, business.currency)} />
          <Row label={`Tax (${(taxBps / 100).toString()}%)`} value={formatMoneyExact(totals.tax, business.currency)} />
          <Divider />
          <Row label="Total" value={formatMoneyExact(totals.total, business.currency)} strong />
        </Card>

        {inv?.paymentUrl ? (
          <Text variant="small" tone="secondary">
            Payment link: {inv.paymentUrl}
          </Text>
        ) : inv?.status === 'sent' && !paymentsAvailable() ? (
          <Text variant="small" tone="secondary">
            Online card payment links turn on once Stripe is connected (Settings → Payments). Until then, mark the invoice paid when you
            receive payment.
          </Text>
        ) : null}

        {inv && inv.status === 'sent' ? (
          <Button
            label="Mark as paid"
            icon="check"
            variant="secondary"
            loading={busy === 'paid'}
            onPress={() => run('paid', async () => void (await persist({ status: 'paid', paidAt: new Date().toISOString() })))}
          />
        ) : null}
        {inv && !locked ? (
          <Button
            label="Void invoice"
            variant="danger"
            onPress={async () => {
              if (await confirm('Void this invoice?', 'It stays on record but can no longer be paid.', 'Void', true)) {
                await run('void', async () => void (await persist({ status: 'void' })));
              }
            }}
          />
        ) : null}
        {inv?.status === 'draft' ? (
          <Button
            label="Delete draft"
            variant="ghost"
            onPress={async () => {
              if (await confirm('Delete draft?', 'This cannot be undone.', 'Delete', true)) {
                await repo.deleteInvoice(inv.id);
                router.back();
              }
            }}
          />
        ) : null}
      </UpgradeGate>
    </Screen>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant={strong ? 'heading' : 'body'} tone={strong ? 'default' : 'secondary'}>
        {label}
      </Text>
      <Text variant={strong ? 'heading' : 'bodyStrong'}>{value}</Text>
    </View>
  );
}
