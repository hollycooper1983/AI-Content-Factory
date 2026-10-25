import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform } from 'react-native';

import { BookingLinkCard } from '@/components/booking-link-card';
import { Screen } from '@/components/screen';
import { Button, Card, Field, SwitchRow, Text } from '@/components/ui';
import { bookingUrl, repo } from '@/lib/data';
import { slugify } from '@/lib/defaults';
import { errorMessage, notify } from '@/lib/dialogs';
import { useApp, useBusiness } from '@/providers/app-provider';

export default function BusinessProfile() {
  const business = useBusiness();
  const { setBusiness } = useApp();
  const [form, setForm] = useState({
    name: business.name,
    slug: business.slug,
    phone: business.phone,
    email: business.email,
    address: business.address,
    about: business.about,
    bookingPageEnabled: business.bookingPageEnabled,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v });

  const save = async () => {
    if (!form.name.trim()) return setError('Enter your business name.');
    if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(form.slug)) return setError('Your link needs 3–40 letters, numbers or dashes.');
    setBusy(true);
    try {
      setBusiness(await repo.updateBusiness(business.id, { ...form, name: form.name.trim(), about: form.about.trim() }));
      notify('Saved', 'Your booking page is up to date.');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const preview = () => {
    if (Platform.OS === 'web') router.push(`/b/${business.slug}`);
    else Linking.openURL(bookingUrl(business.slug));
  };

  return (
    <Screen
      title="Booking page"
      footer={
        <>
          {error ? <Text tone="danger">{error}</Text> : null}
          <Button label="Save changes" onPress={save} loading={busy} />
        </>
      }>
      <BookingLinkCard slug={business.slug} name={business.name} />
      <Button label="Preview booking page" icon="externalLink" variant="secondary" onPress={preview} />
      <Card>
        <SwitchRow
          label="Accept online bookings"
          description="Turn off to pause your public page (for example while on leave)."
          value={form.bookingPageEnabled}
          onValueChange={(v) => set('bookingPageEnabled', v)}
        />
      </Card>
      <Field label="Business name" value={form.name} onChangeText={(v) => set('name', v)} />
      <Field label="Booking link" value={form.slug} onChangeText={(v) => set('slug', slugify(v))} autoCapitalize="none" helper={bookingUrl(form.slug)} />
      <Field label="About" value={form.about} onChangeText={(v) => set('about', v)} multiline placeholder="A short welcome for customers: specialties, parking, policies." />
      <Field label="Phone" value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
      <Field label="Email" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
      <Field label="Address or service area" value={form.address} onChangeText={(v) => set('address', v)} />
    </Screen>
  );
}
