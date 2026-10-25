import { router, useLocalSearchParams } from 'expo-router';
import { Linking, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Avatar, Badge, Button, Card, ErrorBanner, FadeIn, IconButton, ListRow, LoadingList, SectionHeader, Text } from '@/components/ui';
import { UpgradeGate } from '@/components/upgrade-gate';
import { useLoad } from '@/hooks/use-load';
import { useNow } from '@/hooks/use-now';
import { STATUS_LABEL, STATUS_TONE } from '@/lib/analytics';
import { repo } from '@/lib/data';
import { formatMoneyExact } from '@/lib/money';
import { formatInstant } from '@/lib/scheduling';
import { useBusiness } from '@/providers/app-provider';
import { space } from '@/theme/tokens';

export default function ClientProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const business = useBusiness();
  const now = useNow();
  const { data, error, reload } = useLoad(async () => {
    const [client, history, services] = await Promise.all([
      repo.getClient(id),
      repo.listClientAppointments(id),
      repo.listServices(business.id),
    ]);
    return { client, history, services };
  }, [id, business.id]);

  if (!data) {
    return (
      <Screen title="Client">
        {error ? <ErrorBanner message={error} onRetry={reload} /> : <LoadingList rows={3} />}
      </Screen>
    );
  }
  const { client, history, services } = data;
  if (!client) {
    return (
      <Screen title="Client">
        <Text tone="secondary">This client was removed.</Text>
      </Screen>
    );
  }

  const done = history.filter((a) => a.status === 'completed' || a.status === 'confirmed');
  const spent = history.filter((a) => a.status === 'completed').reduce((s, a) => s + a.priceCents, 0);
  const upcoming = history.filter((a) => Date.parse(a.startsAt) > now && (a.status === 'confirmed' || a.status === 'pending'));

  return (
    <Screen
      title={client.name}
      right={<IconButton icon="edit" label="Edit client" onPress={() => router.push(`/client-form?id=${client.id}`)} />}>
      <UpgradeGate feature="clients" title="Client profiles and history">
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Avatar name={client.name} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="heading">{client.name}</Text>
            <Text variant="small" tone="secondary">
              {client.phone || 'No phone'} · {client.email || 'No email'}
            </Text>
          </View>
        </Card>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          {[
            { label: 'Visits', value: String(done.length) },
            { label: 'Spent', value: formatMoneyExact(spent, business.currency) },
            { label: 'Upcoming', value: String(upcoming.length) },
          ].map((s) => (
            <Card key={s.label} style={{ flex: 1, padding: space.md }}>
              <Text variant="stat" numberOfLines={1}>
                {s.value}
              </Text>
              <Text variant="small" tone="secondary">
                {s.label}
              </Text>
            </Card>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {client.phone ? (
            <Button label="Call" icon="phone" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${client.phone}`)} />
          ) : null}
          {client.phone ? (
            <Button label="Text" icon="mail" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => Linking.openURL(`sms:${client.phone}`)} />
          ) : null}
          <Button label="Book" icon="plus" size="md" style={{ flex: 1 }} onPress={() => router.push(`/appointment/new?client=${client.id}`)} />
        </View>
        {client.notes ? (
          <Card style={{ gap: 4 }}>
            <Text variant="caption" tone="secondary">
              NOTES
            </Text>
            <Text>{client.notes}</Text>
          </Card>
        ) : null}
        <SectionHeader title="History" />
        {history.length === 0 ? <Text tone="secondary">No appointments yet.</Text> : null}
        {history.map((a, i) => (
          <FadeIn key={a.id} index={i}>
            <ListRow
              title={services.find((s) => s.id === a.serviceId)?.name ?? 'Appointment'}
              subtitle={`${formatInstant(a.startsAt, business.timezone)} · ${formatMoneyExact(a.priceCents, business.currency)}`}
              right={<Badge label={STATUS_LABEL[a.status]} tone={STATUS_TONE[a.status]} />}
              onPress={() => router.push(`/appointment/${a.id}`)}
            />
          </FadeIn>
        ))}
      </UpgradeGate>
    </Screen>
  );
}
