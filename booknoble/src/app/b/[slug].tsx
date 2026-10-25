import Head from 'expo-router/head';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import Animated, { FadeInRight, ReduceMotion } from 'react-native-reanimated';

import { DateStrip } from '@/components/date-strip';
import { Icon } from '@/components/icon';
import { PublicShell } from '@/components/public-shell';
import { SlotGrid } from '@/components/slot-grid';
import { SuccessCheck } from '@/components/success-check';
import { Button, Card, Divider, Field, FadeIn, IconButton, LoadingList, Text } from '@/components/ui';
import { dayRange } from '@/lib/analytics';
import { manageUrl, repo } from '@/lib/data';
import { errorMessage } from '@/lib/dialogs';
import { industryById } from '@/lib/industries';
import { formatMoney, formatMoneyExact } from '@/lib/money';
import { addDays, availableSlots, formatDuration, formatInstant, todayIn, workingRanges, type Slot } from '@/lib/scheduling';
import type { BusyInterval, PublicBookingResult, PublicBusiness, Service } from '@/lib/types';
import { useTheme } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

type Step = 'service' | 'time' | 'details' | 'done';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PublicBooking() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const [page, setPage] = useState<PublicBusiness | null | undefined>(undefined);
  const [busy, setBusy] = useState<BusyInterval[]>([]);
  const [step, setStep] = useState<Step>('service');
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PublicBookingResult | null>(null);

  const loadBusy = useCallback(async (p: PublicBusiness) => {
    const tz = p.business.timezone;
    const today = todayIn(tz);
    const [from] = dayRange(today, tz);
    const [, to] = dayRange(addDays(today, p.business.maxAdvanceDays), tz);
    setBusy(await repo.getBusyIntervals(p.business.slug, from, to));
  }, []);

  useEffect(() => {
    repo
      .getPublicBusiness(slug)
      .then(async (p) => {
        setPage(p);
        if (p) {
          setDate(todayIn(p.business.timezone));
          await loadBusy(p);
        }
      })
      .catch(() => setPage(null));
  }, [slug, loadBusy]);

  const b = page?.business;
  const today = b ? todayIn(b.timezone) : '';

  const slotQuery = useCallback(
    (d: string) =>
      page && service
        ? availableSlots({
            date: d,
            durationMinutes: service.durationMinutes,
            weekly: page.availability.weekly,
            timeOff: page.availability.timeOff,
            busy,
            timezone: page.business.timezone,
            bufferMinutes: page.business.bufferMinutes,
            slotStepMinutes: page.business.slotStepMinutes,
            minNoticeMinutes: page.business.minNoticeMinutes,
            maxAdvanceDays: page.business.maxAdvanceDays,
          })
        : [],
    [page, service, busy],
  );

  const slots = useMemo(() => (date ? slotQuery(date) : []), [date, slotQuery]);

  // Jump to the first day with openings when a service is picked.
  const pickService = (s: Service) => {
    setService(s);
    setSlot(null);
    setStep('time');
    if (!page) return;
    for (let i = 0; i <= Math.min(page.business.maxAdvanceDays, 60); i++) {
      const d = addDays(today, i);
      const q = availableSlots({
        date: d,
        durationMinutes: s.durationMinutes,
        weekly: page.availability.weekly,
        timeOff: page.availability.timeOff,
        busy,
        timezone: page.business.timezone,
        bufferMinutes: page.business.bufferMinutes,
        slotStepMinutes: page.business.slotStepMinutes,
        minNoticeMinutes: page.business.minNoticeMinutes,
        maxAdvanceDays: page.business.maxAdvanceDays,
      });
      if (q.length) {
        setDate(d);
        return;
      }
    }
  };

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError('Please enter your name.');
    if (!email.trim() && !phone.trim()) return setError('Please enter an email or mobile number so we can confirm.');
    if (email.trim() && !EMAIL.test(email.trim())) return setError('Please check your email address.');
    if (!service || !slot || !b) return;
    setSubmitting(true);
    try {
      const r = await repo.createPublicBooking({
        slug: b.slug,
        serviceId: service.id,
        startsAt: slot.startsAt,
        name,
        phone,
        email,
        notes,
      });
      setResult(r);
      setStep('done');
      if (r.checkoutUrl) Linking.openURL(r.checkoutUrl);
    } catch (e) {
      setError(errorMessage(e));
      // Someone else may have taken the slot: refresh availability.
      if (page) await loadBusy(page);
      setStep('time');
      setSlot(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (page === undefined) {
    return (
      <PublicShell title="Loading…">
        <LoadingList rows={4} />
      </PublicShell>
    );
  }
  if (!page || !b) {
    return (
      <PublicShell title="Booking page not found">
        <Text tone="secondary">This link may be mistyped, or the business isn’t taking online bookings right now.</Text>
      </PublicShell>
    );
  }

  const ind = industryById(b.industry);
  const deposit = service && b.depositsEnabled ? service.depositCents : 0;
  const stepIndex = { service: 0, time: 1, details: 2, done: 3 }[step];
  const back = step === 'time' ? 'service' : step === 'details' ? 'time' : null;

  return (
    <PublicShell
      cover={ind.image}
      title={b.name}
      subtitle={[ind.label, b.address].filter(Boolean).join(' · ')}
      top={
        back ? <IconButton icon="chevronLeft" label="Back" tone="nav" onPress={() => setStep(back)} /> : null
      }>
      <Head>
        <title>{`Book with ${b.name}`}</title>
        <meta name="description" content={`Book an appointment with ${b.name} online.`} />
      </Head>

      {step !== 'done' ? (
        <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Step ${stepIndex + 1} of 3`}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= stepIndex ? colors.primary : colors.border }} />
          ))}
        </View>
      ) : null}

      <Animated.View key={step} entering={FadeInRight.duration(280).reduceMotion(ReduceMotion.System)} style={{ gap: space.lg }}>
        {step === 'service' ? (
          <>
            {b.about ? <Text tone="secondary">{b.about}</Text> : null}
            <Text variant="title">Choose a service</Text>
            {page.services.length === 0 ? <Text tone="secondary">No services are bookable online yet.</Text> : null}
            {page.services.map((s, i) => (
              <FadeIn key={s.id} index={i}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${s.name}, ${formatDuration(s.durationMinutes)}, ${formatMoney(s.priceCents, b.currency)}`}
                  onPress={() => pickService(s)}
                  style={({ pressed }) => ({
                    minHeight: 76,
                    padding: space.lg,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                  })}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text variant="bodyStrong">{s.name}</Text>
                    <Text variant="small" tone="secondary">
                      {formatDuration(s.durationMinutes)}
                      {b.depositsEnabled && s.depositCents ? ` · ${formatMoney(s.depositCents, b.currency)} deposit` : ''}
                    </Text>
                    {s.description ? (
                      <Text variant="small" tone="secondary" numberOfLines={2}>
                        {s.description}
                      </Text>
                    ) : null}
                  </View>
                  <Text variant="heading">{formatMoney(s.priceCents, b.currency)}</Text>
                  <Icon name="chevronRight" size={18} color={colors.primary} />
                </Pressable>
              </FadeIn>
            ))}
          </>
        ) : null}

        {step === 'time' && service && date ? (
          <>
            <View style={{ gap: 2 }}>
              <Text variant="title">Pick a time</Text>
              <Text tone="secondary">
                {service.name} · {formatDuration(service.durationMinutes)}
              </Text>
            </View>
            <DateStrip
              start={today}
              days={Math.min(b.maxAdvanceDays + 1, 90)}
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setSlot(null);
              }}
              disabled={(d) => workingRanges(d, page.availability.weekly, page.availability.timeOff).length === 0}
            />
            <SlotGrid slots={slots} selected={slot?.startsAt ?? null} onSelect={setSlot} />
            {error ? (
              <Text tone="danger" accessibilityRole="text">
                {error}
              </Text>
            ) : null}
            <Text variant="small" tone="secondary">
              Times are shown in {b.timezone.replace('_', ' ')}. Only open times appear.
            </Text>
            <Button label="Continue" disabled={!slot} onPress={() => setStep('details')} />
          </>
        ) : null}

        {step === 'details' && service && slot ? (
          <>
            <Text variant="title">Your details</Text>
            <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" autoCapitalize="words" />
            <Field label="Mobile number" value={phone} onChangeText={setPhone} autoComplete="tel" keyboardType="phone-pad" textContentType="telephoneNumber" />
            <Field label="Email" value={email} onChangeText={setEmail} autoComplete="email" keyboardType="email-address" autoCapitalize="none" />
            <Field label="Anything we should know? (optional)" value={notes} onChangeText={setNotes} multiline />
            <Card style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text>{service.name}</Text>
                <Text variant="bodyStrong">{formatMoney(service.priceCents, b.currency)}</Text>
              </View>
              <Text variant="small" tone="secondary">
                {formatInstant(slot.startsAt, b.timezone)}
              </Text>
              {deposit ? (
                <>
                  <Divider />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="bodyStrong">Deposit due now</Text>
                    <Text variant="bodyStrong" tone="primary">
                      {formatMoneyExact(deposit, b.currency)}
                    </Text>
                  </View>
                </>
              ) : null}
            </Card>
            <Text variant="small" tone="secondary">
              {deposit
                ? 'You’ll pay the deposit on a secure checkout page from our payment partner. Card details never touch BookNoble. '
                : ''}
              Free changes up to {b.cancelWindowHours} hours before your appointment. Your details are shared only with {b.name}.
            </Text>
            {error ? <Text tone="danger">{error}</Text> : null}
            <Button label={deposit ? 'Confirm & pay deposit' : 'Confirm booking'} onPress={submit} loading={submitting} />
          </>
        ) : null}

        {step === 'done' && result && service ? (
          <View style={{ alignItems: 'center', gap: space.lg }}>
            <SuccessCheck />
            <Text variant="title" style={{ textAlign: 'center' }}>
              You’re booked!
            </Text>
            <Text tone="secondary" style={{ textAlign: 'center' }}>
              {service.name} with {b.name}
              {'\n'}
              {formatInstant(result.startsAt, b.timezone)}
            </Text>
            {result.depositCents > 0 ? (
              <Card style={{ alignSelf: 'stretch', gap: space.sm }}>
                <Text variant="bodyStrong">Deposit: {formatMoneyExact(result.depositCents, b.currency)}</Text>
                {result.checkoutUrl ? (
                  <Button label="Pay deposit" icon="card" onPress={() => Linking.openURL(result.checkoutUrl!)} />
                ) : (
                  <Text variant="small" tone="secondary">
                    {b.name} will send you a payment link for the deposit.
                  </Text>
                )}
              </Card>
            ) : null}
            <Card style={{ alignSelf: 'stretch', gap: space.sm }}>
              <Text variant="bodyStrong">Need to change it?</Text>
              <Text variant="small" tone="secondary">
                Save this link to reschedule or cancel: {manageUrl(result.manageToken)}
              </Text>
              <Button label="Manage booking" variant="secondary" size="md" onPress={() => Linking.openURL(manageUrl(result.manageToken))} />
            </Card>
            <Button
              label="Book another"
              variant="ghost"
              onPress={() => {
                setStep('service');
                setResult(null);
                setSlot(null);
                loadBusy(page);
              }}
            />
          </View>
        ) : null}
      </Animated.View>
    </PublicShell>
  );
}
