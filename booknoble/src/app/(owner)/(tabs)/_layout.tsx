import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { useTheme } from '@/theme/theme-provider';
import { fonts } from '@/theme/tokens';

function icon(name: IconName) {
  return function TabIcon({ color }: { color: unknown }) {
    return <Icon name={name} size={22} color={String(color)} />;
  };
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.gold,
          tabBarInactiveTintColor: colors.onNavMuted,
          tabBarStyle: {
            backgroundColor: colors.nav,
            borderTopColor: 'rgba(255,255,255,0.08)',
            height: 64 + insets.bottom,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
        }}>
        <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('home') }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: icon('calendar') }} />
        <Tabs.Screen name="clients" options={{ title: 'Clients', tabBarIcon: icon('users') }} />
        <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: icon('chart') }} />
        <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('more') }} />
      </Tabs>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New appointment"
        onPress={() => router.push('/appointment/new')}
        style={({ pressed }) => ({
          position: 'absolute',
          right: 20,
          bottom: 64 + insets.bottom + 16,
          width: 58,
          height: 58,
          borderRadius: 20,
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.primary,
          shadowOpacity: 0.4,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        })}>
        <Icon name="plus" size={26} color="#FFFFFF" strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
