import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';
import { space } from '@/theme/tokens';

import { Text } from './ui';

/** Customer-facing page frame: business cover, centered card column, BookNoble credit. */
export function PublicShell({
  cover,
  title,
  subtitle,
  top,
  children,
  footer,
}: {
  cover?: number;
  title: string;
  subtitle?: string;
  top?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + space.xl }}>
        <View style={{ height: 200 + insets.top, backgroundColor: colors.nav }}>
          {cover ? <Image source={cover} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} /> : null}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(23,13,53,0.55)' }]} />
          <View style={{ flex: 1, justifyContent: 'space-between', padding: space.xl, paddingTop: insets.top + space.md, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>{top}</View>
            <View style={{ gap: 4 }}>
              <Text variant="title" style={{ color: '#FFFFFF' }}>
                {title}
              </Text>
              {subtitle ? (
                <Text variant="small" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        <View style={{ width: '100%', maxWidth: 640, alignSelf: 'center', padding: space.xl, gap: space.lg }}>{children}</View>
        {footer}
        <Text variant="small" tone="secondary" style={{ textAlign: 'center', marginTop: space.lg }}>
          Powered by <Text variant="smallStrong">BookNoble</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
