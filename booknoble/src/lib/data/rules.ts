import { FREE_UPCOMING_LIMIT, hasFeature } from '../plans';
import { findConflict, validateBooking } from '../scheduling';
import type { Appointment, Availability, Business, BusyInterval } from '../types';
import { BookingConflictError, PlanLimitError } from './repository';

const ACTIVE: Appointment['status'][] = ['pending', 'confirmed'];

export function isActive(a: Pick<Appointment, 'status'>): boolean {
  return ACTIVE.includes(a.status);
}

export function busyFrom(appointments: Appointment[], excludeId?: string): BusyInterval[] {
  return appointments
    .filter((a) => isActive(a) && a.id !== excludeId)
    .map((a) => ({ startsAt: a.startsAt, endsAt: a.endsAt }));
}

/** Owner-side check: no overlap with other active appointments (buffers included). */
export function assertNoConflict(
  candidate: BusyInterval,
  appointments: Appointment[],
  bufferMinutes: number,
  excludeId?: string,
) {
  const hit = findConflict(candidate, busyFrom(appointments, excludeId), bufferMinutes);
  if (hit) throw new BookingConflictError();
}

/** Customer-side check: every booking-page rule (hours, breaks, notice, horizon, overlap). */
export function assertBookable(
  business: Business,
  availability: Availability,
  appointments: Appointment[],
  startsAt: string,
  durationMinutes: number,
  excludeId?: string,
) {
  const res = validateBooking({
    startsAt,
    durationMinutes,
    weekly: availability.weekly,
    timeOff: availability.timeOff,
    busy: busyFrom(appointments, excludeId),
    timezone: business.timezone,
    bufferMinutes: business.bufferMinutes,
    slotStepMinutes: business.slotStepMinutes,
    minNoticeMinutes: business.minNoticeMinutes,
    maxAdvanceDays: business.maxAdvanceDays,
  });
  if (!res.ok) throw new BookingConflictError(res.reason);
}

export function assertWithinPlan(business: Business, appointments: Appointment[], now = new Date()) {
  if (hasFeature(business.plan, 'unlimited_appointments')) return;
  const upcoming = appointments.filter((a) => isActive(a) && Date.parse(a.startsAt) >= now.getTime()).length;
  if (upcoming >= FREE_UPCOMING_LIMIT) {
    throw new PlanLimitError(
      `The Free plan holds up to ${FREE_UPCOMING_LIMIT} upcoming appointments. Upgrade to Starter for unlimited bookings.`,
    );
  }
}
