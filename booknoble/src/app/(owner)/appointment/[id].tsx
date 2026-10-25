import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Avatar, Badge, Button, Card, Divider, ErrorBanner, LoadingList, Text } from '@/components/ui';
import { useLoad } from '@/hooks/use-load';
import { useNow } from '@/hooks/use-now';
import { STATUS_LABEL, STATUS_TONE } from '@/lib/analytics';
import { manageUrl, repo } from '@/lib/data';
import { confirm, errorMessage, notify } from '@/lib/dialogs';
import { formatMoneyExact } from '@/lib/money';
import { hasFeature } from '@/lib/plans';
import { formatDuration, formatInstant, formatMinutes, utcToLocal } from '@/lib/scheduling';
import type { AppointmentStatus } from '@/lib/types';
import { useBusiness } from '@/providers/app-provider';
import { useTheme } from '@/theme/theme-provider';
import { space } from '@/theme/tokens';

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const business = useBusiness();
  const { colors } = useTheme();
  const tz = business.timezone;
  const [busy, setBusy] = useState<string | null>(null);
  const now = useNow();

  const { data, error, reload, setData } = useLoad(async () => {
    const a = await repo.getAppointment(id);
    if (!a) return null;
    const [client, services] = await Promise.all([repo.getClient(a.clientId), repo.listServices(business.id)]);
    return { a, client, service: services.find((s) => s.id === a.serviceId) ?? null };
  }, [id, business.id]);

  const setStatus = async (status: AppointmentStatus, ask?: [string, string]) => {
    if (!data) return;
    if (ask && !(await confirm(ask[0], ask[1], 'Yes', status === 'cancelled'))) return;
    setBusy(status);
    try {
      const a = await repo.updateAppointment(data.a.id, { status });
      setData({ ...data, a });
    } catch (e) {
      notify('Couldn’t update', errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const markDepositPaid = async () => {
    if (!data) return;
    const a = await repo.updateAppointment(data.a.id, { depositStatus: 'paid' });
    setData({ ...data, a });
  };

  if (data === null) {
    return (
      <Screen title="Appointment">
        <Text tone="secondary">This appointment no longer exists.</Text>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen title="Appointment">
        {error ? <ErrorBanner message={error} onRetry={reload} /> : <LoadingList rows={3} />}
      </Screen>
    );
  }

  const { a, client, service } = data;
  const start = utcToLocal(a.startsAt, tz);
  const end = utcToLocal(a.endsAt, tz);
  const active = a.status === 'confirmed' || a.status === 'pending';
  const isPast = Date.parse(a.startsAt) < now;

  return (
    <Screen title={service?.name ?? 'Appointment'} subtitle={formatInstant(a.startsAt, tz)}>
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Badge label={STATUS_LABEL[a.status]} tone={STATUS_TONE[a.status]} />
          <Text variant="small" tone="secondary">
            {a.source === 'booking_page' ? 'Booked online' : 'Booked by you'}
          </Text>
        </View>
        <Text variant="title">
          {formatMinutes(start.minutes)} – {formatMinutes(end.minutes)}
        </Text>
        <Text tone="secondary">
          {formatDuration(Math.round((Date.parse(a.endsAt) - Date.parse(a.startsAt)) / 60000))} · {formatMoneyExact(a.priceCents, business.currency)}
        </Text>
        {a.depositCents > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Icon name="card" size={18} color={colors.textSecondary} />
            <Text variant="small" style={{ flex: 1 }}>
              Deposit {formatMoneyExact(a.depositCents, business.currency)} ·{' '}
              {a.depositStatus === 'paid' ? 'paid' : a.depositStatus === 'refunded' ? 'refunded' : 'not yet paid'}
            </Text>
            {a.depositStatus === 'due' ? <Button label="Mark paid" size="md" variant="secondary" onPress={markDepositPaid} /> : null}
          </View>
        ) : null}
        {a.notes ? (
          <>
            <Divider />
            <Text variant="small" tone="secondary">
              {a.notes}
            </Text>
          </>
        ) : null}
      </Card>

      {client ? (
        <Card style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Avatar name={client.name} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{client.name}</Text>
              <Text variant="small" tone="secondary">
                {[client.phone, client.email].filter(Boolean).join(' · ') || 'No contact details'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {client.phone ? (
              <Button label="Call" icon="phone" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${client.phone}`)} />
            ) : null}
            {client.email ? (
              <Button label="Email" icon="mail" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => Linking.openURL(`mailto:${client.email}`)} />
            ) : null}
            {hasFeature(business.plan, 'clients') ? (
              <Button label="Profile" icon="user" variant="secondary" size="md" style={{ flex: 1 }} onPress={() => router.push(`/client/${client.id}`)} />
            ) : null}
          </View>
        </Card>
      ) : null}

      {active ? (
        <View style={{ gap: space.sm }}>
          {isPast ? (
            <>
              <Button label="Mark completed" icon="check" onPress={() => setStatus('completed')} loading={busy === 'completed'} />
              <Button label="Mark no-show" variant="secondary" onPress={() => setStatus('no_show')} loading={busy === 'no_show'} />
            </>
          ) : (
            <>
              {a.status === 'pending' ? <Button label="Accept booking" icon="check" onPress={() => setStatus('confirmed')} /> : null}
              <Button label="Reschedule" icon="calendar" variant="secondary" onPress={() => router.push(`/appointment/new?reschedule=${a.id}`)} />
              <Button
                label="Copy customer’s manage link"
                icon="link"
                variant="secondary"
                onPress={async () => {
                  await Clipboard.setStringAsync(manageUrl(a.manageToken));
                  notify('Link copied', 'Your customer can use it to reschedule or cancel.');
                }}
              />
            </>
          )}
          <Button
            label="Cancel appointment"
            variant="danger"
            onPress={() => setStatus('cancelled', ['Cancel this appointment?', 'The time becomes available for booking again.'])}
            loading={busy === 'cancelled'}
          />
        </View>
      ) : a.status === 'cancelled' && !isPast ? (
        <Button label="Restore appointment" variant="secondary" onPress={() => setStatus('confirmed')} />
      ) : null}

      {hasFeature(business.plan, 'invoices') ? (
        <Button label="Create invoice" icon="receipt" variant="ghost" onPress={() => router.push(`/invoices/new?appointment=${a.id}`)} />
      ) : null}
    </Screen>
  );
}
