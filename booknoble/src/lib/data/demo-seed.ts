import { addDays, availableSlots, todayIn } from '../scheduling';
import type { Business } from '../types';
import { repo } from './index';
import { busyFrom } from './rules';

/**
 * DEVELOPMENT / TESTING ONLY. Fills the signed-in business with sample
 * clients and appointments so dashboards and analytics can be exercised.
 * Every record goes through the normal repository, so all booking rules
 * (hours, buffers, no double-booking) still apply. Names are fictional.
 */
const SAMPLE_CLIENTS = [
  ['Jasmine Reyes', '(404) 555-0142', 'jasmine.reyes@example.com'],
  ['Priya Shah', '(404) 555-0187', 'priya.shah@example.com'],
  ['Dana Brooks', '(404) 555-0119', 'dana.brooks@example.com'],
  ['Marcus Lee', '(404) 555-0163', 'marcus.lee@example.com'],
  ['Ava Kim', '(404) 555-0134', 'ava.kim@example.com'],
  ['Lena Ortiz', '(404) 555-0198', 'lena.ortiz@example.com'],
] as const;

export async function seedDemoData(business: Business): Promise<number> {
  const services = (await repo.listServices(business.id)).filter((s) => s.active);
  if (!services.length) throw new Error('Add at least one service first.');
  const existing = await repo.listClients(business.id);
  const clients = [...existing];
  for (const [name, phone, email] of SAMPLE_CLIENTS) {
    if (!clients.some((c) => c.email === email)) {
      clients.push(await repo.upsertClient({ businessId: business.id, name, phone, email, notes: '' }));
    }
  }
  const availability = await repo.getAvailability(business.id);
  const today = todayIn(business.timezone);
  let created = 0;
  // Past two weeks (for analytics) through the next ten days.
  for (let offset = -14; offset <= 10; offset++) {
    const date = addDays(today, offset);
    const from = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const to = new Date(Date.now() + 30 * 86_400_000).toISOString();
    const appts = await repo.listAppointments(business.id, from, to);
    const svc = services[(offset + 20) % services.length];
    const slots = availableSlots({
      date,
      durationMinutes: svc.durationMinutes,
      weekly: availability.weekly,
      timeOff: availability.timeOff,
      busy: busyFrom(appts),
      timezone: business.timezone,
      bufferMinutes: business.bufferMinutes,
      slotStepMinutes: business.slotStepMinutes,
      minNoticeMinutes: 0,
      maxAdvanceDays: 365,
      now: new Date(Date.now() - 20 * 86_400_000),
    });
    const picks = [slots[0], slots[Math.floor(slots.length / 2)]].filter(Boolean);
    for (const [i, slot] of picks.entries()) {
      const client = clients[(offset + 14 + i * 3) % clients.length];
      try {
        const a = await repo.createAppointment({
          businessId: business.id,
          serviceId: svc.id,
          clientId: client.id,
          startsAt: slot.startsAt,
          notes: '',
          priceCents: svc.priceCents,
          depositCents: 0,
          source: i === 0 ? 'booking_page' : 'owner',
        });
        if (offset < 0) await repo.updateAppointment(a.id, { status: (offset + i) % 9 === 0 ? 'no_show' : 'completed' });
        created++;
      } catch {
        // Slot taken or plan limit reached: skip.
      }
    }
  }
  return created;
}
