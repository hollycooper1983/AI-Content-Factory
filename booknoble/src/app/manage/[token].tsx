import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { DateStrip } from '@/components/date-strip';
import { PublicShell } from '@/components/public-shell';
import { SlotGrid } from '@/components/slot-grid';
import { SuccessCheck } from '@/components/success-check';
import { Badge, Button, Card, LoadingList, Text } from '@/components/ui';
import { useNow } from '@/hooks/use-now';
import { dayRange, STATUS_LABEL, STATUS_TONE } from '@/lib/analytics';
import { repo } from '@/lib/data';
import { confirm, errorMessage } from '@/lib/dialogs';
import { industryById } from '@/lib/industries';
import { addDays, availableSlots, formatInstant, todayIn, workingRanges, type Slot } from '@/lib/scheduling';
import type { BusyInterval, ManagedBooking, PublicBusiness } from '@/lib/types';
import { space } from '@/theme/tokens';

async function fetchManaged(token: string) {
  const booking = await repo.getManagedBooking(token).catch(() => null);
  if (!booking) return { booking, page: null, busy: [] as BusyInterval[] };
  const page = await repo.getPublicBusiness(booking.slug).catch(() => null);
  if (!page) return { booking, page, busy: [] as BusyInterval[] };
  const tz = page.business.timezone;
  const today = todayIn(tz);
  const [from] = dayRange(today, tz);
  const [, to] = dayRange(addDays(today, page.business.maxAdvanceDays), tz);
  return { booking, page, busy: await repo.getBusyIntervals(booking.slug, from, to) };
}

/** Customer self-service: reschedule or cancel through the secret link. */
export default function ManageBooking() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [booking, setBooking] = useState<ManagedBooking | null | undefined>(undefined);
  const [page, setPage] = useState<PublicBusiness | null>(null);
  const [busy, setBusy] = useState<BusyInterval[]>([]);
  const [mode, setMode] = useState<'view' | 'reschedule' | 'done'>('view');
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const now = useNow();

  const apply = useCallback((r: Awaited<ReturnType<typeof fetchManaged>>) => {
    setBooking(r.booking);
    setPage(r.page);
    setBusy(r.busy);
    if (r.page) setDate(todayIn(r.page.business.timezone));
  }, []);
  const load = useCallback(() => fetchManaged(token).then(apply), [token, apply]);

  useEffect(() => {
    fetchManaged(token).then(apply);
  }, [token, apply]);

  const service = page?.services.find((s) => s.id === booking?.serviceId);
  const slots = useMemo(() => {
    if (!page || !date || !booking || !service) return [];
    // Exclude the customer's own current booking from the busy list.
    const own = (x: BusyInterval) => x.startsAt === new Date(booking.appointment.startsAt).toISOString();
    return availableSlots({
      date,
      durationMinutes: service.durationMinutes,
      weekly: page.availability.weekly,
      timeOff: page.availability.timeOff,
      busy: busy.filter((x) => !own(x)),
      timezone: page.business.timezone,
      bufferMinutes: page.business.bufferMinutes,
      slotStepMinutes: page.business.slotStepMinutes,
      minNoticeMinutes: page.business.minNoticeMinutes,
      maxAdvanceDays: page.business.maxAdvanceDays,
    });
  }, [page, date, booking, service, busy]);

  if (booking === undefined) {
    return (
      <PublicShell title="Your booking">
        <LoadingList rows={3} />
      </PublicShell>
    );
  }
  if (!booking) {
    return (
      <PublicShell title="Booking not found">
        <Text tone="secondary">This link is invalid or has expired. Please contact the business directly.</Text>
      </PublicShell>
    );
  }

  const tz = page?.business.timezone ?? 'UTC';
  const a = booking.appointment;
  const changeable =
    (a.status === 'confirmed' || a.status === 'pending') && Date.parse(a.startsAt) - now >= booking.cancelWindowHours * 3_600_000;

  const cancel = async () => {
    if (!(await confirm('Cancel booking?', `Cancel your ${booking.serviceName} with ${booking.businessName}?`, 'Cancel booking', true))) return;
    setWorking(true);
    setError(null);
    try {
      await repo.cancelManagedBooking(token);
      setMessage('Your booking is cancelled.');
      setMode('done');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setWorking(false);
    }
  };

  const reschedule = async () => {
    if (!slot) return;
    setWorking(true);
    setError(null);
    try {
      await repo.rescheduleManagedBooking(token, slot.startsAt);
      setMessage(`Moved to ${formatInstant(slot.startsAt, tz)}.`);
      setMode('done');
    } catch (e) {
      setError(errorMessage(e));
      await load();
    } finally {
      setWorking(false);
    }
  };

  return (
    <PublicShell
      cover={page ? industryById(page.business.industry).image : undefined}
      title={booking.businessName}
      subtitle="Manage your booking">
      {mode === 'done' ? (
        <View style={{ alignItems: 'center', gap: space.lg }}>
          <SuccessCheck />
          <Text variant="title" style={{ textAlign: 'center' }}>
            All set
          </Text>
          <Text tone="secondary" style={{ textAlign: 'center' }}>
            {message}
          </Text>
        </View>
      ) : (
        <>
          <Card style={{ gap: space.sm }}>
            <Badge label={STATUS_LABEL[a.status]} tone={STATUS_TONE[a.status]} />
            <Text variant="heading">{booking.serviceName}</Text>
            <Text tone="secondary">{formatInstant(a.startsAt, tz)}</Text>
          </Card>
          {error ? <Text tone="danger">{error}</Text> : null}
          {!changeable ? (
            <Text tone="secondary">
              {a.status === 'cancelled'
                ? 'This booking was cancelled.'
                : `Online changes close ${booking.cancelWindowHours} hours before the appointment. Please contact ${booking.businessName}.`}
            </Text>
          ) : mode === 'view' ? (
            <>
              <Button label="Reschedule" icon="calendar" onPress={() => setMode('reschedule')} />
              <Button label="Cancel booking" variant="danger" onPress={cancel} loading={working} />
            </>
          ) : page && date ? (
            <>
              <Text variant="title">Choose a new time</Text>
              <DateStrip
                start={todayIn(tz)}
                days={Math.min(page.business.maxAdvanceDays + 1, 90)}
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setSlot(null);
                }}
                disabled={(d) => workingRanges(d, page.availability.weekly, page.availability.timeOff).length === 0}
              />
              <SlotGrid slots={slots} selected={slot?.startsAt ?? null} onSelect={setSlot} />
              <Button label="Confirm new time" disabled={!slot} loading={working} onPress={reschedule} />
              <Button label="Keep current time" variant="ghost" onPress={() => setMode('view')} />
            </>
          ) : null}
        </>
      )}
    </PublicShell>
  );
}
