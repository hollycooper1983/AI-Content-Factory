import { router } from 'expo-router';

import { Screen } from '@/components/screen';
import { Badge, EmptyState, ErrorBanner, FadeIn, IconButton, ListRow, LoadingList } from '@/components/ui';
import { UpgradeGate } from '@/components/upgrade-gate';
import { useLoad } from '@/hooks/use-load';
import { repo } from '@/lib/data';
import { formatMoneyExact, invoiceTotals } from '@/lib/money';
import { formatLocalDate } from '@/lib/scheduling';
import { INVOICE_LABEL, INVOICE_TONE } from '@/lib/invoice-status';
import { useBusiness } from '@/providers/app-provider';

export default function Invoices() {
  const business = useBusiness();
  const { data, error, reload } = useLoad(async () => {
    const [invoices, clients] = await Promise.all([repo.listInvoices(business.id), repo.listClients(business.id)]);
    return { invoices, clients };
  }, [business.id]);

  return (
    <Screen
      title="Invoices"
      right={<IconButton icon="plus" label="New invoice" tone="primary" onPress={() => router.push('/invoices/new')} />}>
      <UpgradeGate feature="invoices" title="Invoice clients and get paid">
        {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
        {!data ? (
          <LoadingList />
        ) : data.invoices.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No invoices yet"
            body="Create an invoice from an appointment or from scratch, then share a secure payment link."
            action={{ label: 'New invoice', onPress: () => router.push('/invoices/new') }}
          />
        ) : (
          data.invoices.map((inv, i) => (
            <FadeIn key={inv.id} index={i}>
              <ListRow
                title={`${inv.number} · ${formatMoneyExact(invoiceTotals(inv).total, business.currency)}`}
                subtitle={`${data.clients.find((c) => c.id === inv.clientId)?.name ?? 'Client'} · due ${formatLocalDate(inv.dueDate)}`}
                right={<Badge label={INVOICE_LABEL[inv.status]} tone={INVOICE_TONE[inv.status]} />}
                onPress={() => router.push(`/invoices/${inv.id}`)}
              />
            </FadeIn>
          ))
        )}
      </UpgradeGate>
    </Screen>
  );
}
