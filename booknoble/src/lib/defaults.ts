import type { ReminderSettings, WeeklyHours } from './types';

/** Mon–Fri 9–5 with a lunch break, Saturday 10–3, Sunday closed. */
export function defaultWeeklyHours(): WeeklyHours[] {
  return [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const weekday = d as WeeklyHours['weekday'];
    if (d === 0) return { weekday, open: false, ranges: [], breaks: [] };
    if (d === 6) return { weekday, open: true, ranges: [{ start: 600, end: 900 }], breaks: [] };
    return { weekday, open: true, ranges: [{ start: 540, end: 1020 }], breaks: [{ start: 720, end: 780 }] };
  });
}

export function defaultReminderSettings(businessId: string): ReminderSettings {
  return {
    businessId,
    enabled: true,
    channels: ['email'],
    offsetsHours: [24],
    template: 'Hi {client}, this is a reminder of your {service} with {business} on {when}. Need to change it? {manage_link}',
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch {
    return 'America/New_York';
  }
}

export function randomId(): string {
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function randomToken(): string {
  return (randomId() + randomId()).replace(/-/g, '');
}
