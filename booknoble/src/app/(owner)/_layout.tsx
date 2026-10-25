import { Redirect, Stack } from 'expo-router';

import { useApp } from '@/providers/app-provider';
import { useTheme } from '@/theme/theme-provider';

/** Everything in this group requires a signed-in owner with a business. */
export default function OwnerLayout() {
  const { ready, session, business } = useApp();
  const { colors } = useTheme();
  if (!ready) return null;
  if (!session) return <Redirect href="/sign-in" />;
  if (!business) return <Redirect href="/setup" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
