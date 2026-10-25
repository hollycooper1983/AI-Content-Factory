import type {
  Appointment,
  Availability,
  Business,
  BusyInterval,
  Client,
  ID,
  Invoice,
  ManagedBooking,
  PublicBookingRequest,
  PublicBookingResult,
  PublicBusiness,
  ReminderSettings,
  Service,
  TimeOff,
  WeeklyHours,
} from '../types';

export interface Session {
  userId: string;
  email: string;
}

export type NewBusiness = Pick<Business, 'name' | 'slug' | 'industry' | 'phone' | 'email' | 'address' | 'timezone'> &
  Partial<Pick<Business, 'bufferMinutes' | 'slotStepMinutes'>>;

export type NewAppointment = Pick<
  Appointment,
  'businessId' | 'serviceId' | 'clientId' | 'startsAt' | 'notes' | 'priceCents' | 'depositCents'
> &
  Partial<Pick<Appointment, 'status' | 'source' | 'depositStatus'>>;

/** Thrown when a booking would overlap another one (including buffers). */
export class BookingConflictError extends Error {
  constructor(message = 'That time overlaps another appointment.') {
    super(message);
    this.name = 'BookingConflictError';
  }
}

/** Thrown when an action needs a higher BookNoble plan. */
export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanLimitError';
  }
}

/**
 * Every screen talks to data through this interface. Two implementations:
 *  - SupabaseRepository: production. Postgres + Row Level Security.
 *  - LocalRepository: on-device storage for trying the app before Supabase
 *    is configured. Its data never leaves the device.
 */
export interface Repository {
  readonly mode: 'supabase' | 'local';

  getSession(): Promise<Session | null>;
  onAuthChange(cb: (s: Session | null) => void): () => void;
  signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  /** Permanently deletes the account and every record the business owns. */
  deleteAccount(): Promise<void>;

  getMyBusiness(): Promise<Business | null>;
  createBusiness(input: NewBusiness): Promise<Business>;
  updateBusiness(id: ID, patch: Partial<Business>): Promise<Business>;
  isSlugAvailable(slug: string): Promise<boolean>;

  listServices(businessId: ID): Promise<Service[]>;
  upsertService(s: Partial<Service> & { businessId: ID }): Promise<Service>;
  deleteService(id: ID): Promise<void>;

  getAvailability(businessId: ID): Promise<Availability>;
  saveWeeklyHours(businessId: ID, weekly: WeeklyHours[]): Promise<void>;
  addTimeOff(t: Omit<TimeOff, 'id'>): Promise<TimeOff>;
  deleteTimeOff(id: ID): Promise<void>;

  listClients(businessId: ID): Promise<Client[]>;
  getClient(id: ID): Promise<Client | null>;
  upsertClient(c: Partial<Client> & { businessId: ID }): Promise<Client>;
  deleteClient(id: ID): Promise<void>;

  listAppointments(businessId: ID, fromIso: string, toIso: string): Promise<Appointment[]>;
  listClientAppointments(clientId: ID): Promise<Appointment[]>;
  getAppointment(id: ID): Promise<Appointment | null>;
  createAppointment(a: NewAppointment): Promise<Appointment>;
  updateAppointment(id: ID, patch: Partial<Appointment>): Promise<Appointment>;

  listInvoices(businessId: ID): Promise<Invoice[]>;
  getInvoice(id: ID): Promise<Invoice | null>;
  upsertInvoice(inv: Partial<Invoice> & { businessId: ID }): Promise<Invoice>;
  deleteInvoice(id: ID): Promise<void>;

  getReminderSettings(businessId: ID): Promise<ReminderSettings>;
  saveReminderSettings(s: ReminderSettings): Promise<void>;

  // Public booking page (no sign-in). Exposes only what a customer needs.
  getPublicBusiness(slug: string): Promise<PublicBusiness | null>;
  getBusyIntervals(slug: string, fromIso: string, toIso: string): Promise<BusyInterval[]>;
  createPublicBooking(req: PublicBookingRequest): Promise<PublicBookingResult>;
  getManagedBooking(token: string): Promise<ManagedBooking | null>;
  cancelManagedBooking(token: string): Promise<void>;
  rescheduleManagedBooking(token: string, startsAt: string): Promise<void>;

  /** Web deletion request for people without app access. */
  submitDeletionRequest(email: string, details: string): Promise<void>;
}
