import { useEffect, useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { addDays, MONTH_SHORT, parseDate, WEEKDAY_SHORT, weekdayOf } from '@/lib/scheduling';
import { useTheme } from '@/theme/theme-provider';
import { radius } from '@/theme/tokens';

import { Text } from './ui';

/**
 * Horizontally scrolling day picker. `marked` dates show a dot (e.g. days
 * with bookings); `disabled` dates are dimmed and not selectable.
 */
export function DateStrip({
  start,
  days,
  selected,
  onSelect,
  marked,
  disabled,
  onNav,
}: {
  start: string;
  days: number;
  selected: string;
  onSelect: (date: string) => void;
  marked?: Set<string>;
  disabled?: (date: string) => boolean;
  /** Render on the deep-purple navigation surface. */
  onNav?: boolean;
}) {
  const { colors } = useTheme();
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const dates = Array.from({ length: days }, (_, i) => addDays(start, i));
  const selectedIndex = dates.indexOf(selected);

  useEffect(() => {
    if (selectedIndex > 3) scroller.current?.scrollTo({ x: (selectedIndex - 2) * 60, animated: false });
    // Only on mount: keep the user's scroll position afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {dates.map((d) => {
        const on = d === selected;
        const off = disabled?.(d) ?? false;
        const { m, d: day } = parseDate(d);
        const wd = WEEKDAY_SHORT[weekdayOf(d)];
        const fg = on ? (onNav ? colors.text : colors.textOnPrimary) : onNav ? colors.onNav : colors.text;
        const bg = on ? (onNav ? colors.surface : colors.primary) : onNav ? 'rgba(255,255,255,0.07)' : colors.surface;
        return (
          <Pressable
            key={d}
            disabled={off}
            onPress={() => onSelect(d)}
            accessibilityRole="button"
            accessibilityState={{ selected: on, disabled: off }}
            accessibilityLabel={`${wd} ${MONTH_SHORT[m - 1]} ${day}${marked?.has(d) ? ', has bookings' : ''}`}
            style={{
              width: 54,
              height: 68,
              borderRadius: radius.md,
              backgroundColor: bg,
              borderWidth: onNav ? 0 : 1,
              borderColor: on ? colors.primary : colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              opacity: off ? 0.4 : 1,
            }}>
            <Text variant="caption" style={{ color: fg, letterSpacing: 0.2 }}>
              {wd}
            </Text>
            <Text variant="heading" style={{ color: fg, fontSize: 18 }}>
              {day}
            </Text>
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: marked?.has(d) ? (on ? (onNav ? colors.primary : colors.gold) : colors.gold) : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
