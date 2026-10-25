import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn as RFadeIn, ReduceMotion } from 'react-native-reanimated';

import { DateStrip } from '@/components/date-strip';
import { Screen } from '@/components/screen';
import { ErrorBanner, IconButton, LoadingList, Text } from '@/components/ui';
import { useLoad } from '@/hooks/use-load';
import { dayRange, STATUS_LABEL } from '@/lib/analytics';
import { repo } from '@/lib/data';
import { formatMoney } from '@/lib/money';
import {
  addDays,
  formatDuration,
  formatLocalDate,
  formatMinutes,
  isClosedOn,
  MONTH_SHORT,
  parseDate,
  subtractRanges,
  todayIn,
  utcToLocal,
  weekdayOf,
} from '@/lib/scheduling';
import type { TimeRange } from '@/lib/types';
import { useBusiness } from '@/providers/app-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

type Row =
  | { kind: 'appt'; start: number; end: number; id: string; title: string; sub: string; muted: boolean }
  | { kind: 'break'; start: number; end: number }
  | { kind: 'open'; start: number; end: number };

export default function Calendar() {
  const business = useBusiness();
  const { colors } = useTheme();
  const tz = business.timezone;
  const today = todayIn(tz);
  const [selected, setSelected] = useState(today);
  const stripStart = addDays(today, -7);

  const { data, error, reload, refresh, refreshing } = useLoad(async () => {
    const [from] = dayRange(stripStart, tz);
    const [, to] = dayRange(addDays(today, 90), tz);
    const [appts, services, clients, availability] = await Promise.all([
      repo.listAppointments(business.id, from, to),
      repo.listServices(business.id),
      repo.listClients(business.id),
      repo.getAvailability(business.id),
    ]);
    return { appts, services, clients, availability };
  }, [business.id, today]);

  const marked = new Set(
    (data?.appts ?? []).filter((a) => a.status !== 'cancelled').map((a) => utcToLocal(a.startsAt, tz).date),
  );

  let rows: Row[] = [];
  let closedLabel: string | null = null;
  if (data) {
    const day = data.availability.weekly.find((w) => w.weekday === weekdayOf(selected));
    const off = data.availability.timeOff.find((t) => selected >= t.startDate && selected <= t.endDate);
    const dayAppts = data.appts.filter((a) => utcToLocal(a.startsAt, tz).date === selected);
    const busy: TimeRange[] = [];
    for (const a of dayAppts) {
      const start = utcToLocal(a.startsAt, tz).minutes;
      const end = start + Math.round((Date.parse(a.endsAt) - Date.parse(a.startsAt)) / 60000);
      const s = data.services.find((x) => x.id === a.serviceId);
      const c = data.clients.find((x) => x.id === a.clientId);
      const inactive = a.status === 'cancelled' || a.status === 'no_show';
      if (!inactive) busy.push({ start, end: end + business.bufferMinutes });
      rows.push({
        kind: 'appt',
        start,
        end,
        id: a.id,
        title: s?.name ?? 'Appointment',
        sub: `${c?.name ?? 'Client'} · ${formatDuration(end - start)} · ${formatMoney(a.priceCents, business.currency)}${a.status !== 'confirmed' ? ` · ${STATUS_LABEL[a.status]}` : ''}`,
        muted: inactive,
      });
    }
    if (off || isClosedOn(selected, data.availability.timeOff)) closedLabel = off?.label || 'Time off';
    else if (!day?.open) closedLabel = 'Closed — outside business hours';
    else {
      day.breaks.forEach((b) => rows.push({ kind: 'break', ...b }));
      const openGaps = subtractRanges(subtractRanges(day.ranges, day.breaks), busy).filter((g) => g.end - g.start >= 30);
      openGaps.forEach((g) => rows.push({ kind: 'open', ...g }));
    }
    rows = rows.sort((a, b) => a.start - b.start);
  }

  const { m } = parseDate(selected);
  const booked = rows.filter((r) => r.kind === 'appt' && !r.muted).length;

  return (
    <Screen
      brandHeader
      back={false}
      subtitle={`${MONTH_SHORT[m - 1]} ${parseDate(selected).y}`}
      title="Calendar"
      onRefresh={refresh}
      refreshing={refreshing}
      right={
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <IconButton icon="ban" label="Hours and time off" tone="nav" onPress={() => router.push('/availability')} />
          <IconButton icon="plus" label="New appointment" tone="primary" onPress={() => router.push(`/appointment/new?date=${selected}`)} />
        </View>
      }
      headerExtra={<DateStrip start={stripStart} days={98} selected={selected} onSelect={setSelected} marked={marked} onNav />}>
      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="heading">
          {selected === today ? 'Today · ' : ''}
          {formatLocalDate(selected, 'long')}
        </Text>
        <Text variant="smallStrong" tone="secondary">
          {closedLabel ? 'Closed' : `${booked} booked`}
        </Text>
      </View>

      {!data ? (
        <LoadingList rows={4} />
      ) : (
        <Animated.View key={selected} entering={RFadeIn.duration(260).reduceMotion(ReduceMotion.System)} style={{ gap: space.sm }}>
          {closedLabel ? (
            <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: space.lg }}>
              <Text variant="bodyStrong">{closedLabel}</Text>
              <Text variant="small" tone="secondary">
                Customers can’t book this day. Change it in Hours & time off.
              </Text>
            </View>
          ) : null}
          {rows.length === 0 && !closedLabel ? (
            <Text tone="secondary">No hours set for this day.</Text>
          ) : null}
          {rows.map((r, i) => (
            <View key={`${r.kind}-${r.start}-${i}`} style={{ flexDirection: 'row', gap: space.md }}>
              <Text variant="smallStrong" tone="secondary" style={{ width: 70, paddingTop: 14 }}>
                {formatMinutes(r.start)}
              </Text>
              {r.kind === 'appt' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${r.title}, ${formatMinutes(r.start)}, ${r.sub}`}
                  onPress={() => router.push(`/appointment/${r.id}`)}
                  style={({ pressed }) => ({
                    flex: 1,
                    gap: 2,
                    backgroundColor: colors.surface,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderLeftWidth: 4,
                    borderLeftColor: r.muted ? colors.borderStrong : colors.primary,
                    padding: space.md,
                    opacity: r.muted ? 0.6 : pressed ? 0.8 : 1,
                  })}>
                  <Text variant="bodyStrong" style={{ textDecorationLine: r.muted ? 'line-through' : 'none' }}>
                    {r.title}
                  </Text>
                  <Text variant="small" tone="secondary">
                    {r.sub}
                  </Text>
                </Pressable>
              ) : r.kind === 'break' ? (
                <View style={{ flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: space.md }}>
                  <Text variant="bodyStrong" tone="secondary">
                    Break
                  </Text>
                  <Text variant="small" tone="secondary">
                    Until {formatMinutes(r.end)}
                  </Text>
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open time, ${formatDuration(r.end - r.start)}. Book an appointment`}
                  onPress={() => router.push(`/appointment/new?date=${selected}&time=${r.start}`)}
                  style={({ pressed }) => ({
                    flex: 1,
                    borderRadius: radius.md,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: colors.primary,
                    padding: space.md,
                    backgroundColor: pressed ? colors.primarySoft : 'transparent',
                  })}>
                  <Text variant="bodyStrong" tone="primary">
                    Open · {formatDuration(r.end - r.start)}
                  </Text>
                  <Text variant="small" tone="secondary">
                    Until {formatMinutes(r.end)} · tap to book
                  </Text>
                </Pressable>
              )}
            </View>
          ))}
        </Animated.View>
      )}
    </Screen>
  );
}
