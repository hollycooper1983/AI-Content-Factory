import { formatInstant } from './scheduling';
import type { Appointment, ReminderSettings } from './types';

export interface PlannedReminder {
  appointmentId: string;
  sendAt: string;
  offsetHours: number;
}

/** Reminders due for upcoming active appointments, soonest first. */
export function planReminders(appts: Appointment[], settings: ReminderSettings, now = new Date()): PlannedReminder[] {
  if (!settings.enabled) return [];
  const out: PlannedReminder[] = [];
  for (const a of appts) {
    if (a.status !== 'confirmed' && a.status !== 'pending') continue;
    for (const h of settings.offsetsHours) {
      const sendAt = Date.parse(a.startsAt) - h * 3_600_000;
      if (sendAt > now.getTime()) out.push({ appointmentId: a.id, sendAt: new Date(sendAt).toISOString(), offsetHours: h });
    }
  }
  return out.sort((x, y) => x.sendAt.localeCompare(y.sendAt));
}

/** Same placeholder rules as supabase/functions/send-reminders. */
export function renderReminder(
  template: string,
  v: { client: string; service: string; business: string; startsAt: string; timezone: string; manageLink: string },
): string {
  return template
    .replaceAll('{client}', v.client.split(' ')[0] || v.client)
    .replaceAll('{service}', v.service)
    .replaceAll('{business}', v.business)
    .replaceAll('{when}', formatInstant(v.startsAt, v.timezone))
    .replaceAll('{manage_link}', v.manageLink);
}
