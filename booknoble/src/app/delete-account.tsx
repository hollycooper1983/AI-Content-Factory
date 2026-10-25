import Head from 'expo-router/head';
import { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { SuccessCheck } from '@/components/success-check';
import { Button, Card, Field, Text } from '@/components/ui';
import { CONTACT_EMAIL } from '@/content/legal';
import { repo } from '@/lib/data';
import { errorMessage } from '@/lib/dialogs';
import { space } from '@/theme/tokens';

/**
 * Public web page for account and data deletion requests (required by
 * Google Play for apps with accounts). Signed-in owners can also delete
 * instantly in the app: Settings → Delete account.
 */
export default function DeleteAccountRequest() {
  const [email, setEmail] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter the email address on your account.');
    setBusy(true);
    setError(null);
    try {
      await repo.submitDeletionRequest(email, details.trim());
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Delete your BookNoble data" back={false}>
      <Head>
        <title>Delete account · BookNoble</title>
      </Head>
      {done ? (
        <View style={{ alignItems: 'center', gap: space.lg }}>
          <SuccessCheck />
          <Text variant="heading">Request received</Text>
          <Text tone="secondary" style={{ textAlign: 'center' }}>
            We’ll verify ownership by email and delete the account and associated data within 30 days.
          </Text>
        </View>
      ) : (
        <>
          <Card style={{ gap: space.sm }}>
            <Text variant="heading">Business owners</Text>
            <Text tone="secondary">
              Fastest: open the BookNoble app → More → Settings → Delete account. Deletion is immediate and removes your business profile,
              services, clients, appointments and invoices. Cancel any App Store or Google Play subscription in your store account.
            </Text>
          </Card>
          <Card style={{ gap: space.sm }}>
            <Text variant="heading">Customers who booked with a business</Text>
            <Text tone="secondary">
              Contact the business directly, or submit the form below with the email you booked with and the business name.
            </Text>
          </Card>
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Field label="Details (optional)" value={details} onChangeText={setDetails} multiline placeholder="Business name, what to delete" />
          {error ? <Text tone="danger">{error}</Text> : null}
          <Button label="Request deletion" variant="danger" onPress={submit} loading={busy} />
          <Text variant="small" tone="secondary">
            Data deleted: account credentials, business records, client and booking details. Data kept: records we must retain by law (for
            example tax records) for the legally required period. Questions: {CONTACT_EMAIL}.
          </Text>
        </>
      )}
    </Screen>
  );
}
