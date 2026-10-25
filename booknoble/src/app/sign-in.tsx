import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/icon';
import { LogoMark } from '@/components/logo';
import { Screen } from '@/components/screen';
import { Button, Field, FadeIn, Segmented, Text } from '@/components/ui';
import { repo } from '@/lib/data';
import { errorMessage, notify } from '@/lib/dialogs';
import { useApp } from '@/providers/app-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { colors } = useTheme();
  const { refreshBusiness } = useApp();
  const [mode, setMode] = useState<'signup' | 'signin'>(params.mode === 'signin' ? 'signin' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [sent, setSent] = useState(false);
  const local = repo.mode === 'local';

  const submit = async () => {
    const next: typeof errors = {};
    if (!EMAIL.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!local && password.length < 8) next.password = 'Use at least 8 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { needsConfirmation } = await repo.signUp(email, password);
        if (needsConfirmation) {
          setSent(true);
          return;
        }
      } else {
        await repo.signIn(email, password);
      }
      await refreshBusiness();
      router.replace('/');
    } catch (e) {
      setErrors({ form: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!EMAIL.test(email.trim())) {
      setErrors({ email: 'Enter your email first, then tap “Forgot password”.' });
      return;
    }
    try {
      await repo.resetPassword(email);
      notify('Check your email', 'If an account exists, we sent a link to reset your password.');
    } catch (e) {
      setErrors({ form: errorMessage(e) });
    }
  };

  if (sent) {
    return (
      <Screen back={false}>
        <FadeIn>
          <View style={{ alignItems: 'center', gap: space.lg, paddingTop: space.xxxl }}>
            <Icon name="mail" size={44} color={colors.primary} />
            <Text variant="title" style={{ textAlign: 'center' }}>
              Confirm your email
            </Text>
            <Text tone="secondary" style={{ textAlign: 'center' }}>
              We sent a confirmation link to {email.trim()}. Open it, then come back and sign in.
            </Text>
            <Button
              label="Back to sign in"
              onPress={() => {
                setSent(false);
                setMode('signin');
              }}
            />
          </View>
        </FadeIn>
      </Screen>
    );
  }

  return (
    <Screen
      back={false}
      footer={
        <>
          <Button label={mode === 'signup' ? 'Create account' : 'Sign in'} onPress={submit} loading={busy} />
          <Text variant="small" tone="secondary" style={{ textAlign: 'center' }}>
            By continuing you agree to the{' '}
            <Text variant="smallStrong" tone="primary" accessibilityRole="link" onPress={() => router.push('/terms')}>
              Terms
            </Text>{' '}
            and{' '}
            <Text variant="smallStrong" tone="primary" accessibilityRole="link" onPress={() => router.push('/privacy')}>
              Privacy Policy
            </Text>
            .
          </Text>
        </>
      }>
      <FadeIn>
        <View style={{ gap: space.md, paddingTop: space.xl }}>
          <LogoMark size={56} />
          <Text variant="display">{mode === 'signup' ? 'Create your\nBookNoble account' : 'Welcome back'}</Text>
          <Text tone="secondary">
            {mode === 'signup' ? 'Free to start. Upgrade only when you need more.' : 'Sign in to manage your bookings.'}
          </Text>
        </View>
      </FadeIn>

      <Segmented
        label="Account"
        value={mode}
        onChange={(m) => {
          setMode(m);
          setErrors({});
        }}
        options={[
          { value: 'signup', label: 'New account' },
          { value: 'signin', label: 'Sign in' },
        ]}
      />

      {local ? (
        <View style={{ backgroundColor: colors.goldSoft, borderRadius: radius.md, padding: space.md, flexDirection: 'row', gap: space.sm }}>
          <Icon name="info" size={18} color={colors.goldText} />
          <Text variant="small" style={{ color: colors.goldText, flex: 1 }}>
            Demo mode: no server is connected yet, so your data stays on this device and no password is needed. Connect
            Supabase to enable real accounts (see docs/SETUP.md).
          </Text>
        </View>
      ) : null}

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="you@business.com"
        error={errors.email}
      />
      {local ? null : (
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          textContentType={mode === 'signup' ? 'newPassword' : 'password'}
          placeholder="At least 8 characters"
          error={errors.password}
          onSubmitEditing={submit}
        />
      )}
      {errors.form ? (
        <Text tone="danger" accessibilityRole="text">
          {errors.form}
        </Text>
      ) : null}
      {mode === 'signin' && !local ? (
        <Pressable accessibilityRole="button" onPress={forgot} style={{ alignSelf: 'flex-start', paddingVertical: 8 }}>
          <Text variant="smallStrong" tone="primary">
            Forgot password?
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}
