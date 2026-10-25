import Head from 'expo-router/head';

import type { LegalSection } from '@/content/legal';
import { space } from '@/theme/tokens';

import { Screen } from './screen';
import { Card, Text } from './ui';

export function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <Screen title={title}>
      <Head>
        <title>{`${title} · BookNoble`}</title>
      </Head>
      {sections.map((s) => (
        <Card key={s.heading} style={{ gap: space.sm }}>
          <Text variant="heading" accessibilityRole="header">
            {s.heading}
          </Text>
          <Text tone="secondary">{s.body}</Text>
        </Card>
      ))}
    </Screen>
  );
}
