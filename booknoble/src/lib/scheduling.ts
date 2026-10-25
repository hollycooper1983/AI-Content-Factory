/**
 * Scheduling engine: turns business hours, breaks, time off, buffers and
 * existing bookings into bookable start times, and detects conflicts.
 *
 * Pure functions only (no I/O) so the same rules run in the app, on the
 * public booking page, and in tests. The database enforces the same
 * no-overlap rule independently (see supabase/migrations), so a race between
 * two customers can never produce a double-booking.
 */
import type { BusyInterval, TimeOff, TimeRange, Weekday, WeeklyHours } from './types';

const MINUTE = 60_000;

// ---------------------------------------------------------------------------
// Calendar dates (YYYY-MM-DD, no time zone)
// ---------------------------------------------------------------------------

export function parseDate(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split('-').map(Number);
  return { y, m, d };
}

export function formatDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function addDays(date: string, days: number): string {
  const { y, m, d } = parseDate(date);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return formatDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export function weekdayOf(date: string): Weekday {
  const { y, m, d } = parseDate(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() as Weekday;
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  const pa = parseDate(a);
  const pb = parseDate(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Time zones
// ---------------------------------------------------------------------------

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

/** Wall-clock fields of an instant as seen in `timeZone`. */
export function zonedParts(instant: Date, timeZone: string) {
  const out: Record<string, number> = {};
  for (const p of partsFormatter(timeZone).formatToParts(instant)) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  return {
    y: out.year,
    m: out.month,
    d: out.day,
    hour: out.hour === 24 ? 0 : out.hour,
    minute: out.minute,
    second: out.second,
  };
}

/** Offset of `timeZone` from UTC at `instant`, in minutes (e.g. -300 for EST). */
export function tzOffsetMinutes(instant: Date, timeZone: string): number {
  const p = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / MINUTE);
}

/** Converts a local wall-clock time in `timeZone` to a UTC instant. */
export function localToUtc(date: string, minutes: number, timeZone: string): Date {
  const { y, m, d } = parseDate(date);
  const naive = Date.UTC(y, m - 1, d, 0, minutes);
  // Two passes settle the offset across DST transitions.
  let guess = naive - tzOffsetMinutes(new Date(naive), timeZone) * MINUTE;
  guess = naive - tzOffsetMinutes(new Date(guess), timeZone) * MINUTE;
  return new Date(guess);
}

/** Local calendar date and minute-of-day of an instant in `timeZone`. */
export function utcToLocal(instant: Date | string, timeZone: string): { date: string; minutes: number } {
  const p = zonedParts(typeof instant === 'string' ? new Date(instant) : instant, timeZone);
  return { date: formatDate(p.y, p.m, p.d), minutes: p.hour * 60 + p.minute };
}

export function todayIn(timeZone: string, now: Date = new Date()): string {
  return utcToLocal(now, timeZone).date;
}

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

/** Removes `cuts` from `ranges`, returning sorted, non-empty pieces. */
export function subtractRanges(ranges: TimeRange[], cuts: TimeRange[]): TimeRange[] {
  let pieces = ranges.map((r) => ({ ...r })).filter((r) => r.end > r.start);
  for (const cut of cuts) {
    const next: TimeRange[] = [];
    for (const r of pieces) {
      if (cut.end <= r.start || cut.start >= r.end) {
        next.push(r);
        continue;
      }
      if (cut.start > r.start) next.push({ start: r.start, end: cut.start });
      if (cut.end < r.end) next.push({ start: cut.end, end: r.end });
    }
    pieces = next;
  }
  return pieces.sort((a, b) => a.start - b.start);
}

export function isClosedOn(date: string, timeOff: TimeOff[]): boolean {
  return timeOff.some((t) => date >= t.startDate && date <= t.endDate);
}

/** Bookable working ranges for a local date: hours minus breaks, or none. */
export function workingRanges(date: string, weekly: WeeklyHours[], timeOff: TimeOff[]): TimeRange[] {
  if (isClosedOn(date, timeOff)) return [];
  const day = weekly.find((w) => w.weekday === weekdayOf(date));
  if (!day || !day.open) return [];
  return subtractRanges(day.ranges, day.breaks);
}

// ---------------------------------------------------------------------------
// Conflicts
// ---------------------------------------------------------------------------

/**
 * Two bookings conflict when they overlap or sit closer together than the
 * buffer. Intervals are half-open, so back-to-back with a zero buffer is fine.
 */
export function overlapsWithBuffer(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
  bufferMinutes: number,
): boolean {
  const buf = bufferMinutes * MINUTE;
  return aStart < bEnd + buf && bStart < aEnd + buf;
}

export function findConflict<T extends BusyInterval>(
  candidate: BusyInterval,
  busy: T[],
  bufferMinutes: number,
): T | undefined {
  const cs = Date.parse(candidate.startsAt);
  const ce = Date.parse(candidate.endsAt);
  return busy.find((b) => overlapsWithBuffer(cs, ce, Date.parse(b.startsAt), Date.parse(b.endsAt), bufferMinutes));
}

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

export interface SlotQuery {
  /** Local date YYYY-MM-DD in the business time zone. */
  date: string;
  durationMinutes: number;
  weekly: WeeklyHours[];
  timeOff: TimeOff[];
  busy: BusyInterval[];
  timezone: string;
  bufferMinutes: number;
  slotStepMinutes: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  now?: Date;
}

export interface Slot {
  startsAt: string;
  endsAt: string;
  /** Minutes after local midnight, for display. */
  localMinutes: number;
}

export function availableSlots(q: SlotQuery): Slot[] {
  const now = q.now ?? new Date();
  const today = todayIn(q.timezone, now);
  const ahead = daysBetween(today, q.date);
  if (ahead < 0 || ahead > q.maxAdvanceDays) return [];

  const earliest = now.getTime() + q.minNoticeMinutes * MINUTE;
  const step = Math.max(5, q.slotStepMinutes);
  const slots: Slot[] = [];

  for (const range of workingRanges(q.date, q.weekly, q.timeOff)) {
    // Align start times to the step grid so the menu reads cleanly (9:00, 9:15…).
    const first = Math.ceil(range.start / step) * step;
    for (let m = first; m + q.durationMinutes <= range.end; m += step) {
      const start = localToUtc(q.date, m, q.timezone);
      const end = new Date(start.getTime() + q.durationMinutes * MINUTE);
      if (start.getTime() < earliest) continue;
      const candidate = { startsAt: start.toISOString(), endsAt: end.toISOString() };
      if (findConflict(candidate, q.busy, q.bufferMinutes)) continue;
      slots.push({ ...candidate, localMinutes: m });
    }
  }
  return slots;
}

/** Checks a proposed booking against every rule; returns a reason when invalid. */
export function validateBooking(
  q: Omit<SlotQuery, 'date'> & { startsAt: string },
): { ok: true } | { ok: false; reason: string } {
  const { date, minutes } = utcToLocal(q.startsAt, q.timezone);
  const slots = availableSlots({ ...q, date, slotStepMinutes: 1 });
  if (slots.some((s) => s.startsAt === new Date(q.startsAt).toISOString())) return { ok: true };

  const end = new Date(Date.parse(q.startsAt) + q.durationMinutes * MINUTE).toISOString();
  if (findConflict({ startsAt: q.startsAt, endsAt: end }, q.busy, q.bufferMinutes)) {
    return { ok: false, reason: 'That time was just booked. Please pick another.' };
  }
  const inHours = workingRanges(date, q.weekly, q.timeOff).some(
    (r) => minutes >= r.start && minutes + q.durationMinutes <= r.end,
  );
  if (!inHours) return { ok: false, reason: 'That time is outside business hours.' };
  return { ok: false, reason: 'That time is no longer available.' };
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function formatLocalDate(date: string, style: 'short' | 'long' = 'short'): string {
  const { m, d } = parseDate(date);
  const wd = weekdayOf(date);
  return style === 'long'
    ? `${WEEKDAY_LONG[wd]}, ${MONTH_SHORT[m - 1]} ${d}`
    : `${WEEKDAY_SHORT[wd]}, ${MONTH_SHORT[m - 1]} ${d}`;
}

export function formatInstant(iso: string, timeZone: string): string {
  const { date, minutes } = utcToLocal(iso, timeZone);
  return `${formatLocalDate(date)} · ${formatMinutes(minutes)}`;
}
