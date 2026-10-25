import { router } from 'expo-router';
import { useState } from 'react';

import { Screen } from '@/components/screen';
import { Avatar, EmptyState, ErrorBanner, FadeIn, Field, IconButton, ListRow, LoadingList, Text } from '@/components/ui';
import { UpgradeGate } from '@/components/upgrade-gate';
import { useLoad } from '@/hooks/use-load';
import { repo } from '@/lib/data';
import { useBusiness } from '@/providers/app-provider';

export default function Clients() {
  const business = useBusiness();
  const [q, setQ] = useState('');
  const { data, error, reload, refresh, refreshing } = useLoad(() => repo.listClients(business.id), [business.id]);

  const needle = q.trim().toLowerCase();
  const list = (data ?? []).filter(
    (c) => !needle || c.name.toLowerCase().includes(needle) || c.email.includes(needle) || c.phone.includes(needle),
  );

  return (
    <Screen
      brandHeader
      back={false}
      title="Clients"
      subtitle={data ? `${data.length} total` : ' '}
      onRefresh={refresh}
      refreshing={refreshing}
      right={<IconButton icon="plus" label="Add client" tone="primary" onPress={() => router.push('/client-form')} />}>
      <UpgradeGate feature="clients" title="Know every client by name">
        {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
        <Field label="Search clients" value={q} onChangeText={setQ} placeholder="Name, email or phone" autoCapitalize="none" />
        {!data ? (
          <LoadingList />
        ) : list.length === 0 ? (
          <EmptyState
            icon="users"
            title={needle ? 'No matches' : 'No clients yet'}
            body={needle ? 'Try a different name, email or phone.' : 'Clients appear here automatically when they book, or add one yourself.'}
            action={needle ? undefined : { label: 'Add a client', onPress: () => router.push('/client-form') }}
          />
        ) : (
          list.map((c, i) => (
            <FadeIn key={c.id} index={i}>
              <ListRow
                left={<Avatar name={c.name} />}
                title={c.name}
                subtitle={[c.phone, c.email].filter(Boolean).join(' · ') || 'No contact details'}
                onPress={() => router.push(`/client/${c.id}`)}
              />
            </FadeIn>
          ))
        )}
        <Text variant="small" tone="secondary" style={{ textAlign: 'center' }}>
          Client details are private to your business.
        </Text>
      </UpgradeGate>
    </Screen>
  );
}
