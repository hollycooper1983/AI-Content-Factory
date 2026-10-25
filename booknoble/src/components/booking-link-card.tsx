import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Platform, Share, View } from 'react-native';

import { bookingUrl } from '@/lib/data';
import { useTheme } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

import { Icon } from './icon';
import { Button, Text } from './ui';

export function BookingLinkCard({ slug, name }: { slug: string; name: string }) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const url = bookingUrl(slug);

  const copy = async () => {
    await Clipboard.setStringAsync(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    const message = `Book with ${name}: ${url}`;
    if (Platform.OS === 'web') {
      const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (d: object) => Promise<void> }) : null;
      if (nav?.share) await nav.share({ title: name, text: message, url }).catch(() => {});
      else await copy();
      return;
    }
    await Share.share({ message, url }).catch(() => {});
  };

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Icon name="link" size={18} color={colors.goldText} />
        <Text variant="caption" tone="gold">
          YOUR BOOKING PAGE
        </Text>
      </View>
      <Text variant="bodyStrong" numberOfLines={1} accessibilityRole="link">
        {url.replace(/^https?:\/\//, '')}
      </Text>
      <Text variant="small" tone="secondary">
        Add it to your Instagram bio, texts and Google profile. Customers book without installing anything.
      </Text>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button label={copied ? 'Copied!' : 'Copy link'} icon={copied ? 'check' : 'copy'} variant="secondary" size="md" onPress={copy} style={{ flex: 1 }} />
        <Button label="Share" icon="share" size="md" onPress={share} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
