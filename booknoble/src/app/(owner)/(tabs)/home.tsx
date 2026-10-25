import { router } from 'expo-router';
import { View } from 'react-native';

import { BookingLinkCard } from '@/components/booking-link-card';
import { Icon } from '@/components/icon';
import { RevenueHero } from '@/components/revenue-hero';
import { Screen } from '@/components/screen';
import { Avatar, Card, EmptyState, ErrorBanner, FadeIn, IconButton, ListRow, LoadingList, SectionHeader, Skeleton, Text } from '@/components/ui';
import { useLoad } from '@/hooks/use-load';
import { useNow } from '@/hooks/use-now';
import { computeMetrics, dayRange, STATUS_LABEL, weekStart } from '@/lib/analytics';
import { repo } from '@/lib/data';
import { formatMoney, formatMoneyExact } from '@/lib/money';
import { addDays, formatDuration, formatLocalDate, formatMinutes, todayIn, utcToLocal } from '@/lib/scheduling';
import { useBusiness } from '@/providers/app-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

function greeting(minutes: number) {
  if (minutes < 12 * 60) return 'Good morning';
  if (minutes < 17 * 60) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const business = useBusiness();
  const { colors } = useTheme();
  const tz = business.timezone;
  const today = todayIn(tz);
  const now = useNow();
  const nowLocal = utcToLocal(new Date(now), tz).minutes;

  const { data, error, reload, refresh, refreshing } = useLoad(async () => {
    const monday = weekStart(today);
    const [from] = dayRange(addDays(monday, -7), tz);
    const [, to] = dayRange(addDays(monday, 13), tz);
    const [appts, services, clients, invoices] = await Promise.all([
      repo.listAppointments(business.id, from, to),
      repo.listServices(business.id),
      repo.listClients(business.id),
      repo.listInvoices(business.id),
    ]);
    return { appts, services, clients, invoices };
  }, [business.id, today]);

  const metrics = data ? computeMetrics(data.appts, data.services, data.clients, data.invoices, tz, today) : null;
  const todays = data
    ? data.appts.filter((a) => utcToLocal(a.startsAt, tz).date === today && a.status !== 'cancelled')
    : [];
  const next = data?.appts.find((a) => Date.parse(a.endsAt) > now && (a.status === 'confirmed' || a.status === 'pending'));
  const nameOf = (id: string) => data?.clients.find((c) => c.id === id)?.name ?? 'Client';
  const serviceOf = (id: string) => data?.services.find((s) => s.id === id);

  return (
    <Screen
      brandHeader
      back={false}
      subtitle={formatLocalDate(today, 'long')}
      title={greeting(nowLocal)}
      right={<IconButton icon="bell" label="Reminders" tone="nav" onPress={() => router.push('/reminders')} />}
      onRefresh={refresh}
      refreshing={refreshing}>
      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}

      {repo.mode === 'local' ? (
        <View style={{ flexDirection: 'row', gap: space.sm, backgroundColor: colors.goldSoft, padding: space.md, borderRadius: radius.md }}>
          <Icon name="info" size={18} color={colors.goldText} />
          <Text variant="small" style={{ color: colors.goldText, flex: 1 }}>
            Demo mode — data is saved on this device only. Connect Supabase to go live.
          </Text>
        </View>
      ) : null}

      {!metrics ? (
        <>
          <Skeleton height={190} />
          <LoadingList rows={3} />
        </>
      ) : (
        <>
          <FadeIn index={0}>
            <RevenueHero metrics={metrics} today={today} currency={business.currency} />
          </FadeIn>

          <FadeIn index={1}>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              {[
                { label: 'Today', value: String(metrics.todayCount) },
                { label: 'This week', value: String(metrics.weekCount) },
                { label: 'Outstanding', value: formatMoney(metrics.outstandingCents, business.currency).replace('Free', '$0') },
              ].map((s) => (
                <Card key={s.label} style={{ flex: 1, padding: space.md, gap: 2 }}>
                  <Text variant="stat" numberOfLines={1}>
                    {s.value}
                  </Text>
                  <Text variant="small" tone="secondary">
                    {s.label}
                  </Text>
                </Card>
              ))}
            </View>
          </FadeIn>

          {next ? (
            <FadeIn index={2}>
              <Card
                onPress={() => router.push(`/appointment/${next.id}`)}
                accessibilityLabel={`Next up: ${serviceOf(next.serviceId)?.name} with ${nameOf(next.clientId)}`}
                style={{ backgroundColor: colors.primary, borderColor: colors.primary, gap: space.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="caption" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    NEXT UP
                  </Text>
                  <Text variant="smallStrong" tone="onPrimary">
                    {utcToLocal(next.startsAt, tz).date === today ? 'Today' : formatLocalDate(utcToLocal(next.startsAt, tz).date)} ·{' '}
                    {formatMinutes(utcToLocal(next.startsAt, tz).minutes)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <Avatar name={nameOf(next.clientId)} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" tone="onPrimary">
                      {nameOf(next.clientId)}
                    </Text>
                    <Text variant="small" style={{ color: 'rgba(255,255,255,0.88)' }}>
                      {serviceOf(next.serviceId)?.name} · {formatMoneyExact(next.priceCents, business.currency)}
                      {next.depositStatus === 'paid' ? ' · deposit paid' : next.depositStatus === 'due' ? ' · deposit due' : ''}
                    </Text>
                  </View>
                  <Icon name="chevronRight" size={20} color="#FFFFFF" />
                </View>
              </Card>
            </FadeIn>
          ) : null}

          <FadeIn index={3}>
            <View style={{ gap: space.md }}>
              <SectionHeader title="Today" action={{ label: 'View calendar', onPress: () => router.push('/calendar') }} />
              {todays.length === 0 ? (
                <EmptyState
                  icon="calendar"
                  title="A clear day"
                  body="No appointments today. Share your booking link to fill your calendar."
                />
              ) : (
                todays.map((a) => {
                  const s = serviceOf(a.serviceId);
                  const t = utcToLocal(a.startsAt, tz).minutes;
                  return (
                    <ListRow
                      key={a.id}
                      accent={a.status === 'completed' ? colors.borderStrong : colors.primary}
                      title={s?.name ?? 'Appointment'}
                      subtitle={`${nameOf(a.clientId)} · ${formatMinutes(t)} · ${formatDuration(s?.durationMinutes ?? 0)} · ${STATUS_LABEL[a.status]}`}
                      onPress={() => router.push(`/appointment/${a.id}`)}
                    />
                  );
                })
              )}
            </View>
          </FadeIn>

          <FadeIn index={4}>
            <BookingLinkCard slug={business.slug} name={business.name} />
          </FadeIn>
        </>
      )}
    </Screen>
  );
}
