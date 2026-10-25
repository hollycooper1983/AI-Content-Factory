import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';
import { MAX_CONTENT_WIDTH, space } from '@/theme/tokens';

import { IconButton, Text } from './ui';

interface Props {
  title?: string;
  subtitle?: string;
  /** Show a back button (defaults to true when the stack can go back). */
  back?: boolean;
  right?: ReactNode;
  /** Deep-purple brand header, used on top-level tabs. */
  brandHeader?: boolean;
  headerExtra?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  title,
  subtitle,
  back,
  right,
  brandHeader,
  headerExtra,
  children,
  footer,
  scroll = true,
  onRefresh,
  refreshing = false,
  contentStyle,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const showBack = back ?? router.canGoBack();
  const onNav = brandHeader;

  const header =
    title || right || showBack ? (
      <View
        style={{
          backgroundColor: onNav ? colors.nav : colors.background,
          paddingTop: insets.top + space.md,
          paddingBottom: onNav ? space.lg : space.sm,
          paddingHorizontal: space.xl,
          borderBottomLeftRadius: onNav ? 28 : 0,
          borderBottomRightRadius: onNav ? 28 : 0,
        }}>
        <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', gap: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            {showBack ? (
              <IconButton
                icon="chevronLeft"
                label="Back"
                tone={onNav ? 'nav' : 'surface'}
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              />
            ) : null}
            <View style={{ flex: 1, gap: 2 }}>
              {subtitle ? (
                <Text variant="small" style={{ color: onNav ? colors.onNavMuted : colors.textSecondary }}>
                  {subtitle}
                </Text>
              ) : null}
              {title ? (
                <Text variant="title" style={{ color: onNav ? colors.onNav : colors.text }} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}
            </View>
            {right}
          </View>
          {headerExtra}
        </View>
      </View>
    ) : (
      <View style={{ height: insets.top }} />
    );

  const inner = (
    <View
      style={[
        { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', padding: space.xl, gap: space.lg },
        contentStyle,
      ]}>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header}
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          // Tab screens leave room for the floating “new appointment” button.
          contentContainerStyle={{ paddingBottom: footer ? space.lg : insets.bottom + space.xxxl + (brandHeader ? 72 : 0) }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined
          }>
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{inner}</View>
      )}
      {footer ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: space.xl,
            paddingTop: space.md,
            paddingBottom: insets.bottom + space.md,
          }}>
          <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', gap: space.sm }}>{footer}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
