import { addDays, localToUtc, utcToLocal, weekdayOf } from './scheduling';
import type { Appointment, Client, Invoice, Service } from './types';
import { invoiceTotals } from './money';

/** UTC bounds of a local calendar day. */
export function dayRange(date: string, tz: string): [string, string] {
  return [localToUtc(date, 0, tz).toISOString(), localToUtc(addDays(date, 1), 0, tz).toISOString()];
}

/** Monday of the week containing `date`. */
export function weekStart(date: string): string {
  const wd = weekdayOf(date);
  return addDays(date, wd === 0 ? -6 : 1 - wd);
}

const counts = (a: Appointment) => a.status === 'confirmed' || a.status === 'completed' || a.status === 'pending';

export interface Metrics {
  weekRevenueCents: number;
  lastWeekRevenueCents: number;
  changePct: number | null;
  todayCount: number;
  weekCount: number;
  newClients: number;
  /** Revenue per day Mon..Sun of the current week. */
  daily: { date: string; cents: number }[];
  topServices: { name: string; count: number; cents: number }[];
  busiestWeekday: number | null;
  noShowRate: number;
  cancelRate: number;
  outstandingCents: number;
  bookingPageShare: number;
}

export function computeMetrics(
  appts: Appointment[],
  services: Service[],
  clients: Client[],
  invoices: Invoice[],
  tz: string,
  today: string,
): Metrics {
  const monday = weekStart(today);
  const lastMonday = addDays(monday, -7);
  const local = (a: Appointment) => utcToLocal(a.startsAt, tz).date;

  const inRange = (a: Appointment, from: string, toExcl: string) => {
    const d = local(a);
    return d >= from && d < toExcl;
  };
  const thisWeek = appts.filter((a) => inRange(a, monday, addDays(monday, 7)));
  const lastWeek = appts.filter((a) => inRange(a, lastMonday, monday));
  const sum = (xs: Appointment[]) => xs.filter(counts).reduce((s, a) => s + a.priceCents, 0);
  const weekRevenueCents = sum(thisWeek);
  const lastWeekRevenueCents = sum(lastWeek);

  const daily = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return { date, cents: sum(thisWeek.filter((a) => local(a) === date)) };
  });

  const byService = new Map<string, { count: number; cents: number }>();
  for (const a of appts.filter(counts)) {
    const cur = byService.get(a.serviceId) ?? { count: 0, cents: 0 };
    byService.set(a.serviceId, { count: cur.count + 1, cents: cur.cents + a.priceCents });
  }
  const topServices = [...byService.entries()]
    .map(([id, v]) => ({ name: services.find((s) => s.id === id)?.name ?? 'Service', ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const perWeekday = new Array(7).fill(0);
  appts.filter(counts).forEach((a) => perWeekday[weekdayOf(local(a))]++);
  const max = Math.max(...perWeekday);

  const past = appts.filter((a) => local(a) <= today);
  const closed = past.filter((a) => a.status !== 'pending' && a.status !== 'confirmed');
  const noShows = past.filter((a) => a.status === 'no_show').length;
  const cancels = appts.filter((a) => a.status === 'cancelled').length;

  const outstanding =
    invoices.filter((i) => i.status === 'sent').reduce((s, i) => s + invoiceTotals(i).total, 0) +
    appts.filter((a) => a.depositStatus === 'due' && counts(a)).reduce((s, a) => s + a.depositCents, 0);

  const monthAgo = localToUtc(addDays(today, -30), 0, tz).toISOString();

  return {
    weekRevenueCents,
    lastWeekRevenueCents,
    changePct: lastWeekRevenueCents > 0 ? Math.round(((weekRevenueCents - lastWeekRevenueCents) / lastWeekRevenueCents) * 100) : null,
    todayCount: appts.filter((a) => counts(a) && local(a) === today).length,
    weekCount: thisWeek.filter(counts).length,
    newClients: clients.filter((c) => c.createdAt >= monthAgo).length,
    daily,
    topServices,
    busiestWeekday: max > 0 ? perWeekday.indexOf(max) : null,
    noShowRate: closed.length ? noShows / closed.length : 0,
    cancelRate: appts.length ? cancels / appts.length : 0,
    outstandingCents: outstanding,
    bookingPageShare: appts.length ? appts.filter((a) => a.source === 'booking_page').length / appts.length : 0,
  };
}

export const STATUS_LABEL: Record<Appointment['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

export const STATUS_TONE: Record<Appointment['status'], 'success' | 'info' | 'neutral' | 'danger' | 'warning'> = {
  pending: 'warning',
  confirmed: 'success',
  completed: 'info',
  cancelled: 'neutral',
  no_show: 'danger',
};
