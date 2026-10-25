import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { Screen } from '@/components/screen';
import { Button, Field, Text } from '@/components/ui';
import { repo } from '@/lib/data';
import { confirm, errorMessage } from '@/lib/dialogs';
import { useBusiness } from '@/providers/app-provider';

export default function ClientForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const business = useBusiness();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    repo.getClient(id).then((c) => {
      if (!c) return;
      setName(c.name);
      setPhone(c.phone);
      setEmail(c.email);
      setNotes(c.notes);
    });
  }, [id]);

  const save = async () => {
    if (!name.trim()) return setError('Enter a name.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Check the email address.');
    setBusy(true);
    try {
      const c = await repo.upsertClient({
        ...(id ? { id } : {}),
        businessId: business.id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        notes: notes.trim(),
      });
      if (id) router.back();
      else router.replace(`/client/${c.id}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    const ok = await confirm(
      'Delete client?',
      'This permanently deletes the client, their appointment history and invoices from BookNoble.',
      'Delete',
      true,
    );
    if (!ok) return;
    await repo.deleteClient(id);
    router.replace('/clients');
  };

  return (
    <Screen
      title={id ? 'Edit client' : 'New client'}
      footer={
        <>
          {error ? <Text tone="danger">{error}</Text> : null}
          <Button label="Save client" onPress={save} loading={busy} />
        </>
      }>
      <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" />
      <Field label="Mobile" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field
        label="Private notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Preferences, allergies, vehicle, access instructions…"
        helper="Only you can see notes. Avoid storing sensitive health or payment information."
      />
      {id ? <Button label="Delete client" icon="trash" variant="danger" onPress={remove} /> : null}
    </Screen>
  );
}
