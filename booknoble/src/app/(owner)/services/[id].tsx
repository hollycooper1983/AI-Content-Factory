import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Card, Chip, Field, LoadingList, Stepper, SwitchRow, Text } from '@/components/ui';
import { repo } from '@/lib/data';
import { confirm, errorMessage } from '@/lib/dialogs';
import { centsToInput, parseMoney } from '@/lib/money';
import { hasFeature } from '@/lib/plans';
import { formatDuration } from '@/lib/scheduling';
import type { Service } from '@/lib/types';
import { useBusiness } from '@/providers/app-provider';
import { space } from '@/theme/tokens';

const QUICK_DURATIONS = [30, 45, 60, 90, 120, 180];

export default function ServiceEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const business = useBusiness();
  const isNew = id === 'new';
  const [svc, setSvc] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const depositsAllowed = hasFeature(business.plan, 'deposits');

  useEffect(() => {
    if (isNew) return;
    repo.listServices(business.id).then((all) => {
      const s = all.find((x) => x.id === id);
      if (!s) return;
      setSvc(s);
      setName(s.name);
      setDescription(s.description);
      setDuration(s.durationMinutes);
      setPrice(centsToInput(s.priceCents));
      setDeposit(s.depositCents ? centsToInput(s.depositCents) : '');
      setActive(s.active);
    });
  }, [id, isNew, business.id]);

  const save = async () => {
    const priceCents = parseMoney(price);
    const depositCents = parseMoney(deposit);
    if (!name.trim()) return setError('Give the service a name.');
    if (priceCents === null) return setError('Enter a valid price, like 45 or 45.50.');
    if (depositCents === null) return setError('Enter a valid deposit amount.');
    if (depositCents > priceCents && priceCents > 0) return setError('A deposit can’t be more than the price.');
    setBusy(true);
    try {
      await repo.upsertService({
        ...(svc ? { id: svc.id } : {}),
        businessId: business.id,
        name: name.trim(),
        description: description.trim(),
        durationMinutes: duration,
        priceCents,
        depositCents: depositsAllowed ? depositCents : 0,
        active,
      });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!svc) return;
    const ok = await confirm('Delete service?', 'Past appointments keep their history; the service is hidden if it has been booked.', 'Delete', true);
    if (!ok) return;
    await repo.deleteService(svc.id);
    router.back();
  };

  if (!isNew && !svc) {
    return (
      <Screen title="Service">
        <LoadingList rows={3} />
      </Screen>
    );
  }

  return (
    <Screen
      title={isNew ? 'New service' : 'Edit service'}
      footer={
        <>
          {error ? <Text tone="danger">{error}</Text> : null}
          <Button label="Save service" onPress={save} loading={busy} />
        </>
      }>
      <Field label="Service name" value={name} onChangeText={setName} placeholder="e.g. Full detail" autoCapitalize="sentences" />
      <Field
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="What’s included, what to bring, prep notes…"
      />
      <Card style={{ gap: space.md }}>
        <Stepper label="Duration" value={duration} onChange={setDuration} step={15} min={15} max={720} format={formatDuration} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {QUICK_DURATIONS.map((d) => (
            <Chip key={d} label={formatDuration(d)} selected={duration === d} onPress={() => setDuration(d)} />
          ))}
        </View>
      </Card>
      <Field label={`Price (${business.currency})`} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0 for free" />
      <Field
        label="Deposit (optional)"
        value={deposit}
        onChangeText={setDeposit}
        keyboardType="decimal-pad"
        placeholder="0"
        editable={depositsAllowed}
        helper={
          depositsAllowed
            ? 'Collected at booking through your payment processor when deposits are turned on.'
            : 'Deposits are available on Starter and Pro.'
        }
      />
      <Card>
        <SwitchRow label="Show on booking page" description="Turn off to hide without deleting." value={active} onValueChange={setActive} />
      </Card>
      {svc ? <Button label="Delete service" variant="danger" icon="trash" onPress={remove} /> : null}
    </Screen>
  );
}
