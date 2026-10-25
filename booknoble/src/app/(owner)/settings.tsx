import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Button, Card, Divider, Field, ListRow, Segmented, SectionHeader, SwitchRow, Text } from '@/components/ui';
import { repo } from '@/lib/data';
import { seedDemoData } from '@/lib/data/demo-seed';
import { LocalRepository } from '@/lib/data/local';
import { confirm, errorMessage, notify } from '@/lib/dialogs';
import { paymentsAvailable, startStripeOnboarding } from '@/lib/payments';
import { hasFeature } from '@/lib/plans';
import { useApp, useBusiness } from '@/providers/app-provider';
import { useTheme, type ThemePreference } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

export default function Settings() {
  const business = useBusiness();
  const { session, setBusiness } = useApp();
  const { colors, preference, setPreference } = useTheme();
  const [deleteText, setDeleteText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      notify('Something went wrong', errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const signOut = () =>
    run('signout', async () => {
      await repo.signOut();
      router.replace('/sign-in?mode=signin');
    });

  const deleteAccount = () =>
    run('delete', async () => {
      const ok = await confirm(
        'Delete account permanently?',
        'This deletes your account, business profile, services, clients, appointments and invoices. Active app-store subscriptions must be cancelled separately in your store account.',
        'Delete forever',
        true,
      );
      if (!ok) return;
      await repo.deleteAccount();
      notify('Account deleted', 'Your BookNoble account and data have been deleted.');
      router.replace('/onboarding');
    });

  return (
    <Screen title="Settings">
      <SectionHeader title="Appearance" />
      <Segmented<ThemePreference>
        label="Theme"
        value={preference}
        onChange={setPreference}
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />

      <SectionHeader title="Payments" />
      <Card style={{ gap: space.sm }}>
        <SwitchRow
          label="Collect deposits at booking"
          description={
            hasFeature(business.plan, 'deposits')
              ? 'Uses each service’s deposit amount. Requires a connected Stripe account.'
              : 'Available on Starter and Pro.'
          }
          value={business.depositsEnabled}
          disabled={!hasFeature(business.plan, 'deposits')}
          onValueChange={(depositsEnabled) =>
            run('deposits', async () => setBusiness(await repo.updateBusiness(business.id, { depositsEnabled })))
          }
        />
        <Divider />
        <Text variant="small" tone="secondary">
          Customer payments are processed by Stripe on your own Stripe account. BookNoble never stores card numbers and never holds your
          money.
        </Text>
        <Button
          label="Connect Stripe"
          icon="card"
          variant="secondary"
          size="md"
          loading={busy === 'stripe'}
          onPress={() =>
            run('stripe', async () => {
              if (!paymentsAvailable()) {
                notify('Connect Supabase first', 'Payments need the BookNoble server. See docs/SETUP.md → Payments.');
                return;
              }
              const url = await startStripeOnboarding();
              if (url) await Linking.openURL(url);
            })
          }
        />
      </Card>

      <SectionHeader title="Account" />
      <ListRow left={<Icon name="mail" size={20} color={colors.primary} />} title="Signed in as" subtitle={session?.email} />
      <ListRow left={<Icon name="shield" size={20} color={colors.primary} />} title="Privacy Policy" onPress={() => router.push('/privacy')} />
      <ListRow left={<Icon name="info" size={20} color={colors.primary} />} title="Terms of Service" onPress={() => router.push('/terms')} />
      <Button label="Sign out" icon="logout" variant="secondary" onPress={signOut} loading={busy === 'signout'} />

      {repo instanceof LocalRepository || __DEV__ ? (
        <>
          <SectionHeader title="Testing tools" />
          <Card style={{ gap: space.sm }}>
            <Text variant="small" tone="secondary">
              For development and testing only. Adds fictional clients and appointments through the normal booking rules.
            </Text>
            <Button
              label="Add sample appointments"
              variant="secondary"
              size="md"
              loading={busy === 'seed'}
              onPress={() =>
                run('seed', async () => {
                  const n = await seedDemoData(business);
                  notify('Sample data added', `${n} appointments created.`);
                })
              }
            />
          </Card>
        </>
      ) : null}

      <SectionHeader title="Delete account" />
      <View style={{ backgroundColor: colors.dangerSoft, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
        <Text variant="small" style={{ color: colors.danger }}>
          Permanently deletes your BookNoble account and all business data. This cannot be undone. Type DELETE to confirm.
        </Text>
        <Field label="Confirmation" value={deleteText} onChangeText={setDeleteText} autoCapitalize="characters" placeholder="DELETE" />
        <Button
          label="Delete my account"
          icon="trash"
          variant="danger"
          disabled={deleteText.trim() !== 'DELETE'}
          loading={busy === 'delete'}
          onPress={deleteAccount}
        />
      </View>
    </Screen>
  );
}
