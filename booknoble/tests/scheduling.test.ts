import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addDays,
  availableSlots,
  findConflict,
  localToUtc,
  subtractRanges,
  utcToLocal,
  validateBooking,
  weekdayOf,
} from '../src/lib/scheduling.ts';
import type { WeeklyHours } from '../src/lib/types.ts';

const TZ = 'America/New_York';
const weekly: WeeklyHours[] = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  weekday: d as WeeklyHours['weekday'],
  open: d !== 0,
  ranges: [{ start: 9 * 60, end: 17 * 60 }],
  breaks: [{ start: 12 * 60, end: 13 * 60 }],
}));
const base = {
  durationMinutes: 60,
  weekly,
  timeOff: [],
  busy: [],
  timezone: TZ,
  bufferMinutes: 0,
  slotStepMinutes: 30,
  minNoticeMinutes: 0,
  maxAdvanceDays: 60,
  // Monday Oct 26 2026, 6:00 AM in New York.
  now: new Date('2026-10-26T10:00:00Z'),
};

test('calendar math', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(weekdayOf('2026-10-25'), 0);
});

test('time zone round-trips, including across DST', () => {
  assert.equal(localToUtc('2026-10-27', 9 * 60, TZ).toISOString(), '2026-10-27T13:00:00.000Z');
  // US DST ends Nov 1 2026: 9 AM is now UTC-5.
  assert.equal(localToUtc('2026-11-02', 9 * 60, TZ).toISOString(), '2026-11-02T14:00:00.000Z');
  assert.deepEqual(utcToLocal('2026-11-02T14:00:00.000Z', TZ), { date: '2026-11-02', minutes: 540 });
});

test('breaks are carved out of working hours', () => {
  assert.deepEqual(subtractRanges([{ start: 540, end: 1020 }], [{ start: 720, end: 780 }]), [
    { start: 540, end: 720 },
    { start: 780, end: 1020 },
  ]);
});

test('slots respect hours, breaks and duration', () => {
  const slots = availableSlots({ ...base, date: '2026-10-27' });
  const times = slots.map((s) => s.localMinutes);
  assert.equal(times[0], 9 * 60);
  assert.ok(times.includes(11 * 60), '11:00 fits before lunch');
  assert.ok(!times.includes(11 * 60 + 30), '11:30 would run into the break');
  assert.ok(!times.includes(12 * 60));
  assert.equal(times.at(-1), 16 * 60, 'last 60-min slot starts at 4 PM');
});

test('closed days and time off have no slots', () => {
  assert.equal(availableSlots({ ...base, date: '2026-11-01' }).length, 0, 'Sunday closed');
  const timeOff = [{ id: 't', businessId: 'b', startDate: '2026-10-28', endDate: '2026-10-29', label: 'Trip' }];
  assert.equal(availableSlots({ ...base, timeOff, date: '2026-10-29' }).length, 0);
});

test('existing bookings and buffers block overlapping slots', () => {
  const busy = [{ startsAt: '2026-10-27T14:00:00.000Z', endsAt: '2026-10-27T15:00:00.000Z' }]; // 10–11 AM
  const noBuffer = availableSlots({ ...base, busy, date: '2026-10-27' }).map((s) => s.localMinutes);
  assert.ok(noBuffer.includes(9 * 60), '9–10 is back-to-back, allowed');
  assert.ok(!noBuffer.includes(9 * 60 + 30));
  assert.ok(!noBuffer.includes(10 * 60 + 30));
  assert.ok(noBuffer.includes(11 * 60));

  const withBuffer = availableSlots({ ...base, busy, bufferMinutes: 15, date: '2026-10-27' }).map((s) => s.localMinutes);
  assert.ok(!withBuffer.includes(9 * 60), '9–10 leaves no buffer before 10');
  assert.ok(!withBuffer.includes(11 * 60), '11:00 leaves no buffer after 11');
});

test('minimum notice and booking horizon', () => {
  const slots = availableSlots({ ...base, minNoticeMinutes: 4 * 60, date: '2026-10-26' });
  assert.ok(slots.every((s) => s.localMinutes >= 10 * 60), 'nothing before 10 AM with 4 hr notice');
  assert.equal(availableSlots({ ...base, maxAdvanceDays: 3, date: '2026-11-05' }).length, 0);
  assert.equal(availableSlots({ ...base, date: '2026-10-20' }).length, 0, 'past dates');
});

test('conflict detection and booking validation', () => {
  const busy = [{ startsAt: '2026-10-27T14:00:00.000Z', endsAt: '2026-10-27T15:00:00.000Z' }];
  assert.ok(findConflict({ startsAt: '2026-10-27T14:30:00.000Z', endsAt: '2026-10-27T15:30:00.000Z' }, busy, 0));
  assert.equal(findConflict({ startsAt: '2026-10-27T15:00:00.000Z', endsAt: '2026-10-27T16:00:00.000Z' }, busy, 0), undefined);

  const ok = validateBooking({ ...base, busy, startsAt: '2026-10-27T15:00:00.000Z' });
  assert.deepEqual(ok, { ok: true });
  const clash = validateBooking({ ...base, busy, startsAt: '2026-10-27T14:30:00.000Z' });
  assert.equal(clash.ok, false);
  const late = validateBooking({ ...base, startsAt: '2026-10-27T22:30:00.000Z' });
  assert.equal(late.ok, false);
});
