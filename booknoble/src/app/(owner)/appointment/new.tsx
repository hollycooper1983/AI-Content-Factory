import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { DateStrip } from '@/components/date-strip';
import { Screen } from '@/components/screen';
import { SlotGrid } from '@/components/slot-grid';
import { SuccessCheck } from '@/components/success-check';
import { Button, Card, Chip, Field, FadeIn, LoadingList, Segmented, SectionHeader, Stepper, SwitchRow, Text } from '@/components/ui';
import { dayRange } from '@/lib/analytics';
import { repo } from '@/lib/data';
import { busyFrom } from '@/lib/data/rules';
import { errorMessage } from '@/lib/dialogs';
import { formatMoney } from '@/lib/money';
import { addDays, availableSlots, formatDuration, formatInstant, localToUtc, todayIn, utcToLocal } from '@/lib/scheduling';
import type { Appointment, Availability, Client, Service } from '@/lib/types';
import { useBusiness } from '@/providers/app-provider';
import { space } from '@/theme/tokens';

/**
 * Owner booking (and rescheduling). Suggests open slots but lets the owner
 * pick any time; the repository still refuses overlaps.
 */
export default function NewAppointment() {
  const params = useLocalSearchParams<{ date?: string; time?: string; reschedule?: string; client?: string }>();
  const business = useBusiness();
  const tz = business.timezone;
  const today = todayIn(tz);

  const [services, setServices] = useState<Service[] | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [existing, setExisting] = useState<Appointment[]>([]);
  const [original, setOriginal] = useState<Appointment | null>(null);

  const [serviceId, setServiceId] = useState<string | null>(null);
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [clientId, setClientId] = useState<string | null>(params.client ?? null);
  const [clientQuery, setClientQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [date, setDate] = useState(params.date && params.date >= today ? params.date : today);
  const [slot, setSlot] = useState<string | null>(null);
  const [custom, setCustom] = useState(params.time != null);
  const [customMinutes, setCustomMinutes] = useState(params.time ? Number(params.time) : 600);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Appointment | null>(null);

  useEffect(() => {
    (async () => {
      const [from] = dayRange(addDays(today, -1), tz);
      const [, to] = dayRange(addDays(today, 120), tz);
      const [s, c, a, appts] = await Promise.all([
        repo.listServices(business.id),
        repo.listClients(business.id),
        repo.getAvailability(business.id),
        repo.listAppointments(business.id, from, to),
      ]);
      setServices(s.filter((x) => x.active));
      setClients(c);
      setAvailability(a);
      setExisting(appts);
      if (s[0]) setServiceId(s.find((x) => x.active)?.id ?? null);
      if (c.length === 0) setClientMode('new');
      if (params.reschedule) {
        const o = await repo.getAppointment(params.reschedule);
        if (o) {
          setOriginal(o);
          setServiceId(o.serviceId);
          setClientId(o.clientId);
          setNotes(o.notes);
          setDate(utcToLocal(o.startsAt, tz).date);
        }
      }
    })().catch((e) => setError(errorMessage(e)));
  }, [business.id, params.reschedule, today, tz]);

  const service = services?.find((s) => s.id === serviceId) ?? null;

  const slots = useMemo(() => {
    if (!service || !availability) return [];
    return availableSlots({
      date,
      durationMinutes: service.durationMinutes,
      weekly: availability.weekly,
      timeOff: availability.timeOff,
      busy: busyFrom(existing, original?.id),
      timezone: tz,
      bufferMinutes: business.bufferMinutes,
      slotStepMinutes: business.slotStepMinutes,
      minNoticeMinutes: 0,
      maxAdvanceDays: 365,
    });
  }, [service, availability, date, existing, original, tz, business.bufferMinutes, business.slotStepMinutes]);

  const startsAt = custom ? localToUtc(date, customMinutes, tz).toISOString() : slot;

  const save = async () => {
    setError(null);
    if (!service) return setError('Choose a service.');
    if (!startsAt) return setError('Choose a time.');
    setBusy(true);
    try {
      if (original) {
        const a = await repo.updateAppointment(original.id, { startsAt, serviceId: service.id, notes });
        setDone(a);
        return;
      }
      let cid = clientId;
      if (clientMode === 'new') {
        if (!newName.trim()) throw new Error('Enter the client’s name.');
        const c = await repo.upsertClient({ businessId: business.id, name: newName.trim(), phone: newPhone.trim(), email: newEmail.trim().toLowerCase() });
        cid = c.id;
      }
      if (!cid) throw new Error('Choose a client.');
      const a = await repo.createAppointment({
        businessId: business.id,
        serviceId: service.id,
        clientId: cid,
        startsAt,
        notes: notes.trim(),
        priceCents: service.priceCents,
        depositCents: business.depositsEnabled ? service.depositCents : 0,
      });
      setDone(a);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Screen back={false} title=" ">
        <FadeIn>
          <View style={{ alignItems: 'center', gap: space.lg, paddingTop: space.xxl }}>
            <SuccessCheck />
            <Text variant="title" style={{ textAlign: 'center' }}>
              {original ? 'Rescheduled' : 'Booked'}
            </Text>
            <Text tone="secondary" style={{ textAlign: 'center' }}>
              {service?.name} · {formatInstant(done.startsAt, tz)}
            </Text>
            <Button label="View appointment" onPress={() => router.replace(`/appointment/${done.id}`)} style={{ alignSelf: 'stretch' }} />
            <Button label="Done" variant="ghost" onPress={() => router.back()} />
          </View>
        </FadeIn>
      </Screen>
    );
  }

  if (!services || !availability) {
    return (
      <Screen title="New appointment">
        <LoadingList rows={4} />
      </Screen>
    );
  }

  if (services.length === 0) {
    return (
      <Screen title="New appointment">
        <Text tone="secondary">Add a service before booking appointments.</Text>
        <Button label="Add a service" onPress={() => router.replace('/services/new')} />
      </Screen>
    );
  }

  const q = clientQuery.trim().toLowerCase();
  const matches = clients.filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 8);

  return (
    <Screen
      title={original ? 'Reschedule' : 'New appointment'}
      footer={
        <>
          {error ? <Text tone="danger">{error}</Text> : null}
          <Button label={original ? 'Save new time' : 'Book appointment'} onPress={save} loading={busy} />
        </>
      }>
      {original ? null : (
        <>
          <SectionHeader title="Client" />
          <Segmented
            label="Client"
            value={clientMode}
            onChange={setClientMode}
            options={[
              { value: 'existing', label: 'Existing' },
              { value: 'new', label: 'New client' },
            ]}
          />
          {clientMode === 'existing' ? (
            <>
              <Field label="Find client" value={clientQuery} onChangeText={setClientQuery} placeholder="Search by name or phone" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                {matches.map((c) => (
                  <Chip key={c.id} label={c.name} selected={c.id === clientId} onPress={() => setClientId(c.id)} />
                ))}
                {matches.length === 0 ? <Text tone="secondary">No matching clients.</Text> : null}
              </View>
            </>
          ) : (
            <Card style={{ gap: space.md }}>
              <Field label="Name" value={newName} onChangeText={setNewName} autoCapitalize="words" autoComplete="name" />
              <Field label="Mobile" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
              <Field label="Email" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" />
            </Card>
          )}
        </>
      )}

      <SectionHeader title="Service" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {services.map((s) => (
          <Chip
            key={s.id}
            label={`${s.name} · ${formatDuration(s.durationMinutes)} · ${formatMoney(s.priceCents, business.currency)}`}
            selected={s.id === serviceId}
            onPress={() => {
              setServiceId(s.id);
              setSlot(null);
            }}
          />
        ))}
      </View>

      <SectionHeader title="Date & time" />
      <DateStrip
        start={today}
        days={120}
        selected={date}
        onSelect={(d) => {
          setDate(d);
          setSlot(null);
        }}
      />
      <SwitchRow label="Custom time" description="Book outside the suggested open times." value={custom} onValueChange={setCustom} />
      {custom ? (
        <Card>
          <Stepper
            label="Starts at"
            value={customMinutes}
            step={5}
            min={0}
            max={1435}
            format={(m) => `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, '0')} ${m < 720 ? 'AM' : 'PM'}`}
            onChange={setCustomMinutes}
          />
        </Card>
      ) : (
        <SlotGrid slots={slots} selected={slot} onSelect={(s) => setSlot(s.startsAt)} />
      )}

      <Field label="Notes (private)" value={notes} onChangeText={setNotes} multiline placeholder="Preferences, address details, gate code…" />
    </Screen>
  );
}
