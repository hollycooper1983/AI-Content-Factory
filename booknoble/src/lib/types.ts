/**
 * BookNoble domain model. These shapes mirror the Supabase tables in
 * supabase/migrations so both data sources return identical objects.
 * Times of day are minutes after midnight in the business's time zone;
 * instants are ISO-8601 strings in UTC.
 */

export type ID = string;

export type IndustryId = 'hair' | 'nails' | 'detailing' | 'housekeeping' | 'events' | 'other';

export type PlanId = 'free' | 'starter' | 'pro';

export interface Business {
  id: ID;
  ownerId: ID;
  name: string;
  slug: string;
  industry: IndustryId;
  phone: string;
  email: string;
  address: string;
  about: string;
  timezone: string;
  currency: string;
  plan: PlanId;
  /** Minutes kept free after each appointment (cleanup, travel). */
  bufferMinutes: number;
  /** Earliest a customer may book ahead of time, in minutes. */
  minNoticeMinutes: number;
  /** How far ahead customers can book, in days. */
  maxAdvanceDays: number;
  /** Granularity of offered start times, in minutes. */
  slotStepMinutes: number;
  /** Minimum hours before start a customer may cancel or reschedule online. */
  cancelWindowHours: number;
  depositsEnabled: boolean;
  bookingPageEnabled: boolean;
  createdAt: string;
}

export interface Service {
  id: ID;
  businessId: ID;
  name: string;
  description: string;
  durationMinutes: number;
  /** Price in minor units (cents). */
  priceCents: number;
  /** Deposit in minor units, 0 for none. */
  depositCents: number;
  active: boolean;
  sortOrder: number;
}

export interface TimeRange {
  /** Minutes after midnight, inclusive. */
  start: number;
  /** Minutes after midnight, exclusive. */
  end: number;
}

/** 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WeeklyHours {
  weekday: Weekday;
  open: boolean;
  ranges: TimeRange[];
  breaks: TimeRange[];
}

export interface TimeOff {
  id: ID;
  businessId: ID;
  /** Local date YYYY-MM-DD. */
  startDate: string;
  /** Local date YYYY-MM-DD, inclusive. */
  endDate: string;
  label: string;
}

export interface Client {
  id: ID;
  businessId: ID;
  name: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentSource = 'owner' | 'booking_page';
export type DepositStatus = 'none' | 'due' | 'paid' | 'refunded';

export interface Appointment {
  id: ID;
  businessId: ID;
  serviceId: ID;
  clientId: ID;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  priceCents: number;
  depositCents: number;
  depositStatus: DepositStatus;
  notes: string;
  /** Secret used by the customer's reschedule / cancel link. */
  manageToken: string;
  createdAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitCents: number;
}

export interface Invoice {
  id: ID;
  businessId: ID;
  clientId: ID;
  appointmentId: ID | null;
  number: string;
  lines: InvoiceLine[];
  taxRateBps: number;
  status: InvoiceStatus;
  dueDate: string;
  notes: string;
  /** Hosted payment link from the payment processor, when enabled. */
  paymentUrl: string | null;
  createdAt: string;
  paidAt: string | null;
}

export type ReminderChannel = 'email' | 'sms';

export interface ReminderSettings {
  businessId: ID;
  enabled: boolean;
  channels: ReminderChannel[];
  /** Hours before the appointment to send each reminder. */
  offsetsHours: number[];
  template: string;
}

export interface Availability {
  weekly: WeeklyHours[];
  timeOff: TimeOff[];
}

/** What the public booking page is allowed to see. No client data. */
export interface PublicBusiness {
  business: Pick<
    Business,
    | 'id'
    | 'name'
    | 'slug'
    | 'industry'
    | 'about'
    | 'address'
    | 'timezone'
    | 'currency'
    | 'bufferMinutes'
    | 'minNoticeMinutes'
    | 'maxAdvanceDays'
    | 'slotStepMinutes'
    | 'cancelWindowHours'
    | 'depositsEnabled'
  >;
  services: Service[];
  availability: Availability;
}

/** A busy interval exposed publicly: times only, never who or what. */
export interface BusyInterval {
  startsAt: string;
  endsAt: string;
}

export interface PublicBookingRequest {
  slug: string;
  serviceId: ID;
  startsAt: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export interface PublicBookingResult {
  appointmentId: ID;
  manageToken: string;
  startsAt: string;
  endsAt: string;
  depositCents: number;
  /** Processor checkout URL when a deposit is required and payments are configured. */
  checkoutUrl: string | null;
}

/** A customer's view of their own booking, reached through the manage link. */
export interface ManagedBooking {
  appointment: Pick<Appointment, 'id' | 'startsAt' | 'endsAt' | 'status' | 'depositCents' | 'depositStatus'>;
  serviceId: ID;
  serviceName: string;
  businessName: string;
  slug: string;
  cancelWindowHours: number;
}
