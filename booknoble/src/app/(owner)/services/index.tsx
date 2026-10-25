import { router } from 'expo-router';

import { Screen } from '@/components/screen';
import { Badge, EmptyState, ErrorBanner, FadeIn, IconButton, ListRow, LoadingList, Text } from '@/components/ui';
import { useLoad } from '@/hooks/use-load';
import { repo } from '@/lib/data';
import { formatMoney } from '@/lib/money';
import { formatDuration } from '@/lib/scheduling';
import { useBusiness } from '@/providers/app-provider';

export default function Services() {
  const business = useBusiness();
  const { data, error, reload } = useLoad(() => repo.listServices(business.id), [business.id]);
  const active = data?.filter((s) => s.active) ?? [];
  const archived = data?.filter((s) => !s.active) ?? [];

  return (
    <Screen
      title="Services & pricing"
      right={<IconButton icon="plus" label="Add service" tone="primary" onPress={() => router.push('/services/new')} />}>
      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
      {!data ? (
        <LoadingList />
      ) : active.length === 0 ? (
        <EmptyState
          icon="tag"
          title="Add your first service"
          body="Services are what customers book. Set a name, duration and price."
          action={{ label: 'Add service', onPress: () => router.push('/services/new') }}
        />
      ) : (
        active.map((s, i) => (
          <FadeIn key={s.id} index={i}>
            <ListRow
              title={s.name}
              subtitle={`${formatDuration(s.durationMinutes)} · ${formatMoney(s.priceCents, business.currency)}${s.depositCents ? ` · ${formatMoney(s.depositCents, business.currency)} deposit` : ''}`}
              onPress={() => router.push(`/services/${s.id}`)}
            />
          </FadeIn>
        ))
      )}
      {archived.length ? (
        <>
          <Text variant="caption" tone="secondary">
            HIDDEN FROM BOOKING PAGE
          </Text>
          {archived.map((s) => (
            <ListRow key={s.id} title={s.name} right={<Badge label="Hidden" />} onPress={() => router.push(`/services/${s.id}`)} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}
