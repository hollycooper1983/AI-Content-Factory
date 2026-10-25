import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { Badge, Button, Card, Divider, Field, IconButton, LoadingList, SectionHeader, Stepper, SwitchRow, Text } from '@/components/ui';
import { repo } from '@/lib/data';
import { errorMessage, notify } from '@/lib/dialogs';
import { hasFeature } from '@/lib/plans';
import { formatDuration, formatLocalDate, formatMinutes, todayIn, WEEKDAY_LONG } from '@/lib/scheduling';
import type { TimeOff, WeeklyHours } from '@/lib/types';
import { useApp, useBusiness } from '@/providers/app-provider';
import { space } from '@/theme/tokens';

const ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function Availability() {
  const business = useBusiness();
  const { setBusiness } = useApp();
  const advanced = hasFeature(business.plan, 'advanced_scheduling');
  const [weekly, setWeekly] = useState<WeeklyHours[] | null>(null);
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [rules, setRules] = useState({
    bufferMinutes: business.bufferMinutes,
    slotStepMinutes: business.slotStepMinutes,
    minNoticeMinutes: business.minNoticeMinutes,
    maxAdvanceDays: business.maxAdvanceDays,
    cancelWindowHours: business.cancelWindowHours,
  });
  const [offStart, setOffStart] = useState('');
  const [offEnd, setOffEnd] = useState('');
  const [offLabel, setOffLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    repo.getAvailability(business.id).then((a) => {
      setWeekly(a.weekly);
      setTimeOff(a.timeOff);
    });
  }, [business.id]);

  const patchDay = (weekday: number, patch: Partial<WeeklyHours>) =>
    setWeekly((w) => w!.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));

  const validate = (): string | null => {
    for (const d of weekly ?? []) {
      if (!d.open) continue;
      const r = d.ranges[0];
      if (!r || r.end <= r.start) return `${WEEKDAY_LONG[d.weekday]}: closing time must be after opening time.`;
      const b = d.breaks[0];
      if (b && (b.start < r.start || b.end > r.end || b.end <= b.start)) return `${WEEKDAY_LONG[d.weekday]}: the break must sit inside open hours.`;
    }
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) return setError(problem);
    setError(null);
    setBusy(true);
    try {
      await repo.saveWeeklyHours(business.id, weekly!);
      const updated = await repo.updateBusiness(business.id, advanced ? rules : { bufferMinutes: rules.bufferMinutes, cancelWindowHours: rules.cancelWindowHours });
      setBusiness(updated);
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const addOff = async () => {
    const end = offEnd || offStart;
    if (!DATE.test(offStart) || !DATE.test(end)) return notify('Use dates like 2026-12-24.');
    if (end < offStart) return notify('The end date must be on or after the start date.');
    const t = await repo.addTimeOff({ businessId: business.id, startDate: offStart, endDate: end, label: offLabel.trim() || 'Time off' });
    setTimeOff((x) => [...x, t].sort((a, b) => a.startDate.localeCompare(b.startDate)));
    setOffStart('');
    setOffEnd('');
    setOffLabel('');
  };

  if (!weekly) {
    return (
      <Screen title="Hours & availability">
        <LoadingList rows={5} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Hours & availability"
      footer={
        <>
          {error ? <Text tone="danger">{error}</Text> : null}
          <Button label="Save availability" onPress={save} loading={busy} />
        </>
      }>
      <Text tone="secondary">
        Customers only see open times inside these hours, minus breaks, time off, existing bookings and buffers. Times are in{' '}
        {business.timezone.replace('_', ' ')}.
      </Text>

      <SectionHeader title="Weekly hours" />
      {ORDER.map((wd) => {
        const d = weekly.find((x) => x.weekday === wd)!;
        const r = d.ranges[0] ?? { start: 540, end: 1020 };
        const b = d.breaks[0];
        return (
          <Card key={wd} style={{ gap: space.sm }}>
            <SwitchRow
              label={WEEKDAY_LONG[wd]}
              description={d.open ? `${formatMinutes(r.start)} – ${formatMinutes(r.end)}${b ? ' · break' : ''}` : 'Closed'}
              value={d.open}
              onValueChange={(open) => patchDay(wd, { open, ranges: open && !d.ranges.length ? [r] : d.ranges })}
            />
            {d.open ? (
              <>
                <Divider />
                <Stepper label="Opens" value={r.start} step={15} min={0} max={r.end - 15} format={formatMinutes} onChange={(v) => patchDay(wd, { ranges: [{ ...r, start: v }] })} />
                <Stepper label="Closes" value={r.end} step={15} min={r.start + 15} max={1440} format={formatMinutes} onChange={(v) => patchDay(wd, { ranges: [{ ...r, end: v }] })} />
                <SwitchRow
                  label="Break"
                  value={!!b}
                  onValueChange={(on) => patchDay(wd, { breaks: on ? [{ start: Math.min(720, r.end - 60), end: Math.min(780, r.end) }] : [] })}
                />
                {b ? (
                  <>
                    <Stepper label="Break starts" value={b.start} step={15} min={r.start} max={b.end - 15} format={formatMinutes} onChange={(v) => patchDay(wd, { breaks: [{ ...b, start: v }] })} />
                    <Stepper label="Break ends" value={b.end} step={15} min={b.start + 15} max={r.end} format={formatMinutes} onChange={(v) => patchDay(wd, { breaks: [{ ...b, end: v }] })} />
                  </>
                ) : null}
              </>
            ) : null}
          </Card>
        );
      })}

      <SectionHeader title="Booking rules" />
      <Card style={{ gap: space.sm }}>
        <Stepper
          label="Buffer after each booking"
          value={rules.bufferMinutes}
          step={5}
          min={0}
          max={240}
          format={(v) => (v ? formatDuration(v) : 'None')}
          onChange={(v) => setRules({ ...rules, bufferMinutes: v })}
        />
        <Text variant="small" tone="secondary">
          Time for cleanup, travel or setup between appointments.
        </Text>
        <Divider />
        <Stepper
          label="Online changes allowed until"
          value={rules.cancelWindowHours}
          step={1}
          min={0}
          max={336}
          format={(v) => `${v} hr before`}
          onChange={(v) => setRules({ ...rules, cancelWindowHours: v })}
        />
      </Card>
      <Card style={{ gap: space.sm, opacity: advanced ? 1 : 0.6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="heading">Advanced scheduling</Text>
          {advanced ? null : <Badge label="Pro" tone="gold" />}
        </View>
        {advanced ? (
          <>
            <Stepper label="Start times every" value={rules.slotStepMinutes} step={5} min={5} max={120} format={formatDuration} onChange={(v) => setRules({ ...rules, slotStepMinutes: v })} />
            <Stepper label="Minimum notice" value={rules.minNoticeMinutes} step={30} min={0} max={10080} format={(v) => (v ? formatDuration(v) : 'None')} onChange={(v) => setRules({ ...rules, minNoticeMinutes: v })} />
            <Stepper label="Book up to" value={rules.maxAdvanceDays} step={7} min={7} max={365} format={(v) => `${v} days ahead`} onChange={(v) => setRules({ ...rules, maxAdvanceDays: v })} />
          </>
        ) : (
          <>
            <Text variant="small" tone="secondary">
              Control start-time spacing, minimum notice and how far ahead customers can book. Current: every{' '}
              {formatDuration(business.slotStepMinutes)}, {formatDuration(business.minNoticeMinutes)} notice, {business.maxAdvanceDays} days ahead.
            </Text>
            <Button label="See Pro plan" variant="secondary" size="md" onPress={() => router.push('/subscription')} />
          </>
        )}
      </Card>

      <SectionHeader title="Holidays & time off" />
      {timeOff.map((t) => (
        <Card key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{t.label || 'Time off'}</Text>
            <Text variant="small" tone="secondary">
              {formatLocalDate(t.startDate)}
              {t.endDate !== t.startDate ? ` – ${formatLocalDate(t.endDate)}` : ''}
            </Text>
          </View>
          <IconButton
            icon="trash"
            label={`Remove ${t.label}`}
            onPress={async () => {
              await repo.deleteTimeOff(t.id);
              setTimeOff((x) => x.filter((y) => y.id !== t.id));
            }}
          />
        </Card>
      ))}
      <Card style={{ gap: space.md }}>
        <Field label="Label" value={offLabel} onChangeText={setOffLabel} placeholder="Holiday, vacation, training…" />
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Field label="From" value={offStart} onChangeText={setOffStart} placeholder={todayIn(business.timezone)} style={{ flex: 1 }} autoCapitalize="none" />
          <Field label="To (optional)" value={offEnd} onChangeText={setOffEnd} placeholder="Same day" style={{ flex: 1 }} autoCapitalize="none" />
        </View>
        <Button label="Add time off" variant="secondary" icon="plus" size="md" onPress={addOff} />
      </Card>
    </Screen>
  );
}
