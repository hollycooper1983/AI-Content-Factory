import { View } from 'react-native';

import { RevenueHero } from '@/components/revenue-hero';
import { Screen } from '@/components/screen';
import { Card, ErrorBanner, FadeIn, LoadingList, SectionHeader, Text } from '@/components/ui';
import { UpgradeGate } from '@/components/upgrade-gate';
import { useLoad } from '@/hooks/use-load';
import { computeMetrics, dayRange } from '@/lib/analytics';
import { repo } from '@/lib/data';
import { formatMoneyExact } from '@/lib/money';
import { addDays, todayIn, WEEKDAY_LONG } from '@/lib/scheduling';
import { useBusiness } from '@/providers/app-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function Insights() {
  const business = useBusiness();
  const { colors } = useTheme();
  const tz = business.timezone;
  const today = todayIn(tz);

  const { data, error, reload, refresh, refreshing } = useLoad(async () => {
    const [from] = dayRange(addDays(today, -90), tz);
    const [, to] = dayRange(addDays(today, 30), tz);
    const [appts, services, clients, invoices] = await Promise.all([
      repo.listAppointments(business.id, from, to),
      repo.listServices(business.id),
      repo.listClients(business.id),
      repo.listInvoices(business.id),
    ]);
    return computeMetrics(appts, services, clients, invoices, tz, today);
  }, [business.id, today]);

  const maxTop = Math.max(1, ...(data?.topServices.map((s) => s.count) ?? [1]));

  return (
    <Screen brandHeader back={false} title="Insights" subtitle="Last 90 days" onRefresh={refresh} refreshing={refreshing}>
      <UpgradeGate feature="analytics" title="See what’s growing your business">
        {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
        {!data ? (
          <LoadingList rows={4} />
        ) : (
          <>
            <FadeIn index={0}>
              <RevenueHero metrics={data} today={today} currency={business.currency} />
            </FadeIn>
            <FadeIn index={1}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
                {[
                  { label: 'New clients (30 days)', value: String(data.newClients) },
                  { label: 'Booked online', value: pct(data.bookingPageShare) },
                  { label: 'No-show rate', value: pct(data.noShowRate) },
                  { label: 'Cancellation rate', value: pct(data.cancelRate) },
                ].map((s) => (
                  <Card key={s.label} style={{ flexBasis: '46%', flexGrow: 1, gap: 2 }}>
                    <Text variant="stat">{s.value}</Text>
                    <Text variant="small" tone="secondary">
                      {s.label}
                    </Text>
                  </Card>
                ))}
              </View>
            </FadeIn>
            <FadeIn index={2}>
              <Card style={{ gap: space.md }}>
                <SectionHeader title="Top services" />
                {data.topServices.length === 0 ? (
                  <Text tone="secondary">Your most-booked services will appear here.</Text>
                ) : (
                  data.topServices.map((s) => (
                    <View key={s.name} style={{ gap: 6 }} accessible accessibilityLabel={`${s.name}: ${s.count} bookings, ${formatMoneyExact(s.cents)}`}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text variant="bodyStrong">{s.name}</Text>
                        <Text variant="small" tone="secondary">
                          {s.count} · {formatMoneyExact(s.cents, business.currency)}
                        </Text>
                      </View>
                      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt }}>
                        <View style={{ height: 8, borderRadius: 4, width: `${(s.count / maxTop) * 100}%`, backgroundColor: colors.primary }} />
                      </View>
                    </View>
                  ))
                )}
              </Card>
            </FadeIn>
            <FadeIn index={3}>
              <View style={{ backgroundColor: colors.goldSoft, borderRadius: radius.lg, padding: space.lg, gap: 4 }}>
                <Text variant="caption" tone="gold">
                  INSIGHT
                </Text>
                <Text variant="bodyStrong">
                  {data.busiestWeekday !== null
                    ? `${WEEKDAY_LONG[data.busiestWeekday]} is your busiest day.`
                    : 'Book a few appointments to unlock trends.'}
                </Text>
                <Text variant="small" tone="secondary">
                  {data.busiestWeekday !== null
                    ? 'Consider extending hours or adding a premium service on that day.'
                    : 'Insights update automatically as bookings come in.'}
                </Text>
              </View>
            </FadeIn>
          </>
        )}
      </UpgradeGate>
    </Screen>
  );
}
