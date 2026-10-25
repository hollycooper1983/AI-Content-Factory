import { router } from 'expo-router';
import { View } from 'react-native';

import { LogoMark } from '@/components/logo';
import { Screen } from '@/components/screen';
import { Button, Text } from '@/components/ui';
import { space } from '@/theme/tokens';

export default function NotFound() {
  return (
    <Screen back={false}>
      <View style={{ alignItems: 'center', gap: space.lg, paddingTop: space.xxxl }}>
        <LogoMark size={64} />
        <Text variant="title">Page not found</Text>
        <Text tone="secondary" style={{ textAlign: 'center' }}>
          The link may be mistyped or the page has moved.
        </Text>
        <Button label="Go home" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}
