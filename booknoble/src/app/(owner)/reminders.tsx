import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Card, Chip, Field, ListRow, LoadingList, SectionHeader, SwitchRow, Text } from '@/components/ui';
import { UpgradeGate } from '@/components/upgrade-gate';
import { useNow } from '@/hooks/use-now';
import { dayRange } from '@/lib/analytics';
import { manageUrl, repo } from '@/lib/data';
import { errorMessage, notify } from '@/lib/dialogs';
import { planReminders, renderReminder, type PlannedReminder } from '@/lib/reminders';
import { addDays, formatInstant, todayIn } from '@/lib/scheduling';
import type { Appointment, Client, ReminderChannel, ReminderSettings, Service } from '@/lib/types';
import { useBusiness } from '@/providers/app-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, space } from '@/theme/tokens';

const OFFSETS = [2, 24, 48];

export default function Reminders() {
  const business = useBusiness();
  const { colors } = useTheme();
  const now = useNow();
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [ctx, setCtx] = useState<{ appts: Appointment[]; clients: Client[]; services: Service[] } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const today = todayIn(business.timezone);
      const [from] = dayRange(today, business.timezone);
      const [, to] = dayRange(addDays(today, 14), business.timezone);
      const [s, appts, clients, services] = await Promise.all([
        repo.getReminderSettings(business.id),
        repo.listAppointments(business.id, from, to),
        repo.listClients(business.id),
        repo.listServices(business.id),
      ]);
      setSettings(s);
      setCtx({ appts, clients, services });
    })().catch((e) => notify('Couldn’t load reminders', errorMessage(e)));
  }, [business.id, business.timezone]);

  if (!settings || !ctx) {
    return (
      <Screen title="Reminders">
        <LoadingList rows={3} />
      </Screen>
    );
  }

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const planned: PlannedReminder[] = planReminders(ctx.appts, settings, new Date(now)).slice(0, 6);
  const sample = ctx.appts[0];
  const preview = renderReminder(settings.template, {
    client: ctx.clients.find((c) => c.id === sample?.clientId)?.name ?? 'Jordan',
    service: ctx.services.find((s) => s.id === sample?.serviceId)?.name ?? ctx.services[0]?.name ?? 'appointment',
    business: business.name,
    startsAt: sample?.startsAt ?? new Date(now + 86_400_000).toISOString(),
    timezone: business.timezone,
    manageLink: manageUrl(sample?.manageToken ?? 'example'),
  });

  const save = async () => {
    if (settings.channels.length === 0) return notify('Pick at least one channel.');
    if (settings.offsetsHours.length === 0) return notify('Pick at least one reminder time.');
    setBusy(true);
    try {
      await repo.saveReminderSettings(settings);
      notify('Reminders saved');
    } catch (e) {
      notify('Couldn’t save', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Reminders" footer={<Button label="Save reminders" onPress={save} loading={busy} />}>
      <UpgradeGate feature="reminders" title="Fewer no-shows with automatic reminders">
        <Card>
          <SwitchRow
            label="Send booking reminders"
            description="Customers get a reminder with a link to reschedule or cancel."
            value={settings.enabled}
            onValueChange={(enabled) => setSettings({ ...settings, enabled })}
          />
        </Card>

        <SectionHeader title="Channels" />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {(['email', 'sms'] as ReminderChannel[]).map((ch) => (
            <Chip
              key={ch}
              icon={ch === 'email' ? 'mail' : 'phone'}
              label={ch === 'email' ? 'Email' : 'Text message'}
              selected={settings.channels.includes(ch)}
              onPress={() => setSettings({ ...settings, channels: toggle(settings.channels, ch) })}
            />
          ))}
        </View>
        <Text variant="small" tone="secondary">
          Texts are sent only to customers who gave a mobile number when booking. Standard message rates may apply to them.
        </Text>

        <SectionHeader title="When" />
        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          {OFFSETS.map((h) => (
            <Chip
              key={h}
              label={`${h} hours before`}
              selected={settings.offsetsHours.includes(h)}
              onPress={() => setSettings({ ...settings, offsetsHours: toggle(settings.offsetsHours, h).sort((a, b) => b - a) })}
            />
          ))}
        </View>

        <Field
          label="Message"
          value={settings.template}
          onChangeText={(template) => setSettings({ ...settings, template })}
          multiline
          helper="Placeholders: {client} {service} {business} {when} {manage_link}"
        />
        <View style={{ backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: space.lg, gap: 4 }}>
          <Text variant="caption" style={{ color: colors.onPrimarySoft }}>
            PREVIEW
          </Text>
          <Text style={{ color: colors.onPrimarySoft }}>{preview}</Text>
        </View>

        <SectionHeader title="Scheduled next" />
        {planned.length === 0 ? (
          <Text tone="secondary">No reminders scheduled in the next two weeks.</Text>
        ) : (
          planned.map((p) => {
            const a = ctx.appts.find((x) => x.id === p.appointmentId)!;
            return (
              <ListRow
                key={`${p.appointmentId}-${p.offsetHours}`}
                title={ctx.clients.find((c) => c.id === a.clientId)?.name ?? 'Client'}
                subtitle={`Sends ${formatInstant(p.sendAt, business.timezone)} · for ${formatInstant(a.startsAt, business.timezone)}`}
              />
            );
          })
        )}
        {repo.mode === 'local' ? (
          <Text variant="small" tone="secondary">
            Demo mode shows the schedule but sends nothing. Reminders are delivered by the server once Supabase and an email/SMS
            provider are connected (docs/SETUP.md).
          </Text>
        ) : null}
      </UpgradeGate>
    </Screen>
  );
}
