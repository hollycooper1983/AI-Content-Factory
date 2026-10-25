import { Pressable, View } from 'react-native';

import { formatMinutes, type Slot } from '@/lib/scheduling';
import { useTheme } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

import { Text } from './ui';

export function SlotGrid({
  slots,
  selected,
  onSelect,
  emptyText = 'No open times this day. Try another date.',
}: {
  slots: Slot[];
  selected: string | null;
  onSelect: (s: Slot) => void;
  emptyText?: string;
}) {
  const { colors } = useTheme();
  if (slots.length === 0) {
    return (
      <View style={{ padding: space.lg, borderRadius: radius.md, backgroundColor: colors.surfaceAlt }}>
        <Text tone="secondary">{emptyText}</Text>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }} accessibilityRole="radiogroup" accessibilityLabel="Available times">
      {slots.map((s) => {
        const on = s.startsAt === selected;
        return (
          <Pressable
            key={s.startsAt}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onSelect(s)}
            style={({ pressed }) => ({
              flexBasis: '30%',
              flexGrow: 1,
              minHeight: 46,
              borderRadius: radius.sm,
              borderWidth: on ? 2 : 1,
              borderColor: on ? colors.primary : colors.borderStrong,
              backgroundColor: on ? colors.primarySoft : pressed ? colors.surfaceAlt : colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            })}>
            <Text variant="bodyStrong" style={{ color: on ? colors.onPrimarySoft : colors.text, fontSize: 14 }}>
              {formatMinutes(s.localMinutes)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
