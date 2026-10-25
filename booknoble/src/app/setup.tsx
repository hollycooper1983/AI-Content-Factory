import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInRight, ReduceMotion } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Button, Field, SwitchRow, Text } from '@/components/ui';
import { bookingUrl, repo } from '@/lib/data';
import { deviceTimezone, slugify } from '@/lib/defaults';
import { errorMessage } from '@/lib/dialogs';
import { INDUSTRIES, industryById } from '@/lib/industries';
import { formatMoney } from '@/lib/money';
import { formatDuration } from '@/lib/scheduling';
import type { IndustryId } from '@/lib/types';
import { useApp } from '@/providers/app-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

const STEPS = ['Your business', 'Your industry', 'Your services'];

export default function Setup() {
  const { colors } = useTheme();
  const { session, setBusiness } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(session?.email ?? '');
  const [address, setAddress] = useState('');
  const [industry, setIndustry] = useState<IndustryId>('hair');
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const starters = industryById(industry).starters;
  const isPicked = (n: string) => picked[`${industry}:${n}`] ?? true;

  const next = async () => {
    setError(null);
    if (step === 0) {
      if (!name.trim()) return setError('Enter your business name.');
      if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug)) {
        return setError('Your link needs 3–40 lowercase letters, numbers or dashes.');
      }
      setBusy(true);
      const free = await repo.isSlugAvailable(slug).catch(() => true);
      setBusy(false);
      if (!free) return setError('That booking link is taken. Try another.');
    }
    if (step < 2) return setStep(step + 1);

    setBusy(true);
    try {
      const ind = industryById(industry);
      const b = await repo.createBusiness({
        name: name.trim(),
        slug,
        industry,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        timezone: deviceTimezone(),
      });
      const tuned = await repo.updateBusiness(b.id, { bufferMinutes: ind.bufferMinutes, slotStepMinutes: ind.slotStepMinutes });
      let order = 0;
      for (const s of ind.starters.filter((x) => isPicked(x.name))) {
        await repo.upsertService({
          businessId: b.id,
          name: s.name,
          description: '',
          durationMinutes: s.durationMinutes,
          priceCents: s.priceCents,
          depositCents: s.depositCents ?? 0,
          active: true,
          sortOrder: order++,
        });
      }
      setBusiness(tuned);
      router.replace('/home');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      back={false}
      title={STEPS[step]}
      subtitle={`Step ${step + 1} of ${STEPS.length}`}
      right={
        step > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => setStep(step - 1)} hitSlop={10} style={{ padding: 8 }}>
            <Text variant="bodyStrong" tone="primary">
              Back
            </Text>
          </Pressable>
        ) : null
      }
      headerExtra={
        <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Setup step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= step ? colors.primary : colors.border }} />
          ))}
        </View>
      }
      footer={
        <>
          {error ? (
            <Text tone="danger" style={{ textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}
          <Button label={step === 2 ? 'Open my booking page' : 'Continue'} onPress={next} loading={busy} />
        </>
      }>
      <Animated.View key={step} entering={FadeInRight.duration(300).reduceMotion(ReduceMotion.System)} style={{ gap: space.lg }}>
        {step === 0 ? (
          <>
            <Text tone="secondary">This is what customers see on your booking page. You can change it anytime.</Text>
            <Field
              label="Business name"
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (!slugEdited) setSlug(slugify(v));
              }}
              placeholder="Luxe & Co. Studio"
              autoCapitalize="words"
            />
            <Field
              label="Booking link"
              value={slug}
              onChangeText={(v) => {
                setSlugEdited(true);
                setSlug(slugify(v));
              }}
              autoCapitalize="none"
              helper={slug ? bookingUrl(slug) : 'Letters, numbers and dashes'}
            />
            <Field label="Business phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="(555) 000-0000" />
            <Field label="Business email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Field
              label="Address or service area"
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main St, or “Mobile — Greater Atlanta”"
            />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text tone="secondary">We’ll tailor starter services, buffers and booking times to how you work.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
              {INDUSTRIES.map((ind) => {
                const on = ind.id === industry;
                return (
                  <Pressable
                    key={ind.id}
                    onPress={() => setIndustry(ind.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`${ind.label}, ${ind.sub}`}
                    style={({ pressed }) => ({
                      flexBasis: '47%',
                      flexGrow: 1,
                      borderRadius: radius.lg,
                      overflow: 'hidden',
                      backgroundColor: colors.surface,
                      borderWidth: 2,
                      borderColor: on ? colors.primary : colors.border,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}>
                    <Image source={ind.image} style={{ width: '100%', height: 96 }} contentFit="cover" accessible={false} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: space.md, gap: space.sm }}>
                      <View style={{ flex: 1 }}>
                        <Text variant="heading" style={{ fontSize: 15 }}>
                          {ind.label}
                        </Text>
                        <Text variant="small" tone="secondary">
                          {ind.sub}
                        </Text>
                      </View>
                      {on ? (
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text tone="secondary">
              Pick a starter menu — edit prices and durations later. Default hours are Mon–Fri 9–5 with a lunch break and
              Saturday 10–3; adjust them in Availability.
            </Text>
            {starters.map((s) => (
              <View
                key={s.name}
                style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.lg, paddingVertical: space.sm }}>
                <SwitchRow
                  label={s.name}
                  description={`${formatDuration(s.durationMinutes)} · ${formatMoney(s.priceCents)}${s.depositCents ? ` · ${formatMoney(s.depositCents)} deposit` : ''}`}
                  value={isPicked(s.name)}
                  onValueChange={(v) => setPicked({ ...picked, [`${industry}:${s.name}`]: v })}
                />
              </View>
            ))}
          </>
        ) : null}
      </Animated.View>
    </Screen>
  );
}
