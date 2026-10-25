import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ONBOARDED_KEY } from '@/lib/storage-keys';
import { useApp } from '@/providers/app-provider';
import { useTheme } from '@/theme/theme-provider';

/** Entry router: onboarding → sign in → business setup → dashboard. */
export default function Index() {
  const { ready, session, business } = useApp();
  const { colors } = useTheme();
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => setSeen(v === '1'))
      .catch(() => setSeen(false));
  }, []);

  if (!ready || seen === null) return <View style={{ flex: 1, backgroundColor: colors.nav }} />;
  if (!session) return <Redirect href={seen ? '/sign-in' : '/onboarding'} />;
  if (!business) return <Redirect href="/setup" />;
  return <Redirect href="/home" />;
}
