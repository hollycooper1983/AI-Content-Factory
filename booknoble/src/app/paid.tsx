import { View } from 'react-native';

import { PublicShell } from '@/components/public-shell';
import { SuccessCheck } from '@/components/success-check';
import { Text } from '@/components/ui';
import { space } from '@/theme/tokens';

/** Landing page after a customer pays an invoice through Stripe Checkout. */
export default function Paid() {
  return (
    <PublicShell title="Payment received">
      <View style={{ alignItems: 'center', gap: space.lg }}>
        <SuccessCheck />
        <Text variant="title">Thank you!</Text>
        <Text tone="secondary" style={{ textAlign: 'center' }}>
          Your payment was processed securely. A receipt is on its way from our payment partner.
        </Text>
      </View>
    </PublicShell>
  );
}
