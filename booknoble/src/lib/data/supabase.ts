import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type {
  Appointment,
  Availability,
  Business,
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
import {
  BookingConflictError,
  PlanLimitError,
  type NewAppointment,
  type NewBusiness,
  type Repository,
  type Session,
} from './repository';

type Row = Record<string, unknown>;

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** Shallow key conversion; JSON columns (ranges, lines) keep their own keys. */
function fromRow<T>(row: Row): T {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) out[toCamel(k)] = v;
  return out as T;
}

function toRow(obj: object): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[toSnake(k)] = v;
  return out;
}

const FRIENDLY: Record<string, string> = {
  SLOT_TAKEN: 'That time was just booked. Please pick another.',
  TOO_SOON: 'That time is too soon to book online.',
  TOO_FAR: 'That date is too far ahead to book.',
  OUTSIDE_HOURS: 'That time is outside business hours.',
  NOT_FOUND: 'This booking page is not available.',
  SERVICE_NOT_FOUND: 'That service is no longer offered.',
  INVALID_DETAILS: 'Please enter your name and an email or phone number.',
  NOT_CHANGEABLE: 'This booking can no longer be changed online.',
  TOO_LATE: 'It is too close to the appointment to change it online. Please contact the business.',
  PLAN_LIMIT: 'This business is not accepting more online bookings right now.',
};

function raise(error: { message: string; code?: string } | null): void {
  if (!error) return;
  if (error.code === '23P01' || error.message.includes('appointments_no_overlap') || error.message.includes('SLOT_TAKEN')) {
    throw new BookingConflictError(FRIENDLY.SLOT_TAKEN);
  }
  if (error.message.includes('businesses_slug_key')) throw new Error('That booking link is taken. Try another.');
  if (error.message.includes('PLAN_LIMIT')) {
    throw new PlanLimitError('The Free plan holds up to 30 upcoming appointments. Upgrade to Starter for unlimited bookings.');
  }
  const key = Object.keys(FRIENDLY).find((k) => error.message.includes(k));
  if (key && ['TOO_SOON', 'TOO_FAR', 'OUTSIDE_HOURS'].includes(key)) throw new BookingConflictError(FRIENDLY[key]);
  throw new Error(key ? FRIENDLY[key] : error.message);
}

export class SupabaseRepository implements Repository {
  readonly mode = 'supabase' as const;
  readonly client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }

  private async one<T>(q: PromiseLike<{ data: Row | null; error: { message: string; code?: string } | null }>) {
    const { data, error } = await q;
    raise(error);
    return data ? fromRow<T>(data) : null;
  }

  private async many<T>(q: PromiseLike<{ data: Row[] | null; error: { message: string; code?: string } | null }>) {
    const { data, error } = await q;
    raise(error);
    return (data ?? []).map((r) => fromRow<T>(r));
  }

  // -- auth ----------------------------------------------------------------

  async getSession(): Promise<Session | null> {
    const { data } = await this.client.auth.getSession();
    const u = data.session?.user;
    return u ? { userId: u.id, email: u.email ?? '' } : null;
  }

  onAuthChange(cb: (s: Session | null) => void) {
    const { data } = this.client.auth.onAuthStateChange((_e, session) => {
      cb(session?.user ? { userId: session.user.id, email: session.user.email ?? '' } : null);
    });
    return () => data.subscription.unsubscribe();
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.client.auth.signUp({ email: email.trim(), password });
    raise(error);
    return { needsConfirmation: !data.session };
  }

  async signIn(email: string, password: string) {
    const { error } = await this.client.auth.signInWithPassword({ email: email.trim(), password });
    raise(error);
  }

  async signOut() {
    await this.client.auth.signOut();
  }

  async resetPassword(email: string) {
    const { error } = await this.client.auth.resetPasswordForEmail(email.trim());
    raise(error);
  }

  async deleteAccount() {
    // Deleting an auth user needs the service role, so it runs server-side.
    const { error } = await this.client.functions.invoke('delete-account', { method: 'POST' });
    raise(error);
    await this.client.auth.signOut();
  }

  // -- business ------------------------------------------------------------

  async getMyBusiness() {
    const s = await this.getSession();
    if (!s) return null;
    return this.one<Business>(this.client.from('businesses').select('*').eq('owner_id', s.userId).maybeSingle());
  }

  async isSlugAvailable(slug: string) {
    const { data } = await this.client.rpc('get_public_business', { p_slug: slug });
    if (!data) return true;
    const mine = await this.getMyBusiness();
    return mine?.slug === slug;
  }

  async createBusiness(input: NewBusiness) {
    const s = await this.getSession();
    if (!s) throw new Error('Not signed in');
    const b = await this.one<Business>(
      this.client.from('businesses').insert(toRow({ ...input, ownerId: s.userId })).select('*').single(),
    );
    return b!;
  }

  async updateBusiness(id: ID, patch: Partial<Business>) {
    const { id: _i, ownerId: _o, plan: _p, createdAt: _c, ...safe } = patch;
    return (await this.one<Business>(this.client.from('businesses').update(toRow(safe)).eq('id', id).select('*').single()))!;
  }

  // -- services ------------------------------------------------------------

  listServices(businessId: ID) {
    return this.many<Service>(this.client.from('services').select('*').eq('business_id', businessId).order('sort_order'));
  }

  async upsertService(s: Partial<Service> & { businessId: ID }) {
    return (await this.one<Service>(this.client.from('services').upsert(toRow(s)).select('*').single()))!;
  }

  async deleteService(id: ID) {
    const { count } = await this.client.from('appointments').select('id', { count: 'exact', head: true }).eq('service_id', id);
    if (count) {
      raise((await this.client.from('services').update({ active: false }).eq('id', id)).error);
    } else {
      raise((await this.client.from('services').delete().eq('id', id)).error);
    }
  }

  // -- availability --------------------------------------------------------

  async getAvailability(businessId: ID): Promise<Availability> {
    const [weekly, timeOff] = await Promise.all([
      this.many<WeeklyHours>(this.client.from('weekly_hours').select('weekday, open, ranges, breaks').eq('business_id', businessId).order('weekday')),
      this.many<TimeOff>(this.client.from('time_off').select('*').eq('business_id', businessId).order('start_date')),
    ]);
    return { weekly, timeOff };
  }

  async saveWeeklyHours(businessId: ID, weekly: WeeklyHours[]) {
    const rows = weekly.map((w) => ({ business_id: businessId, weekday: w.weekday, open: w.open, ranges: w.ranges, breaks: w.breaks }));
    raise((await this.client.from('weekly_hours').upsert(rows)).error);
  }

  async addTimeOff(t: Omit<TimeOff, 'id'>) {
    return (await this.one<TimeOff>(this.client.from('time_off').insert(toRow(t)).select('*').single()))!;
  }

  async deleteTimeOff(id: ID) {
    raise((await this.client.from('time_off').delete().eq('id', id)).error);
  }

  // -- clients -------------------------------------------------------------

  listClients(businessId: ID) {
    return this.many<Client>(this.client.from('clients').select('*').eq('business_id', businessId).order('name'));
  }

  getClient(id: ID) {
    return this.one<Client>(this.client.from('clients').select('*').eq('id', id).maybeSingle());
  }

  async upsertClient(c: Partial<Client> & { businessId: ID }) {
    return (await this.one<Client>(this.client.from('clients').upsert(toRow(c)).select('*').single()))!;
  }

  async deleteClient(id: ID) {
    raise((await this.client.from('clients').delete().eq('id', id)).error);
  }

  // -- appointments --------------------------------------------------------

  listAppointments(businessId: ID, fromIso: string, toIso: string) {
    return this.many<Appointment>(
      this.client
        .from('appointments')
        .select('*')
        .eq('business_id', businessId)
        .gt('ends_at', fromIso)
        .lt('starts_at', toIso)
        .order('starts_at'),
    );
  }

  listClientAppointments(clientId: ID) {
    return this.many<Appointment>(
      this.client.from('appointments').select('*').eq('client_id', clientId).order('starts_at', { ascending: false }),
    );
  }

  getAppointment(id: ID) {
    return this.one<Appointment>(this.client.from('appointments').select('*').eq('id', id).maybeSingle());
  }

  async createAppointment(a: NewAppointment) {
    const row = toRow({
      status: 'confirmed',
      source: 'owner',
      depositStatus: a.depositCents > 0 ? 'due' : 'none',
      ...a,
      // The database trigger recomputes both from the service duration and buffer.
      endsAt: a.startsAt,
      blockedUntil: a.startsAt,
    });
    return (await this.one<Appointment>(this.client.from('appointments').insert(row).select('*').single()))!;
  }

  async updateAppointment(id: ID, patch: Partial<Appointment>) {
    const { id: _i, businessId: _b, manageToken: _m, createdAt: _c, endsAt: _e, ...safe } = patch;
    return (await this.one<Appointment>(this.client.from('appointments').update(toRow(safe)).eq('id', id).select('*').single()))!;
  }

  // -- invoices ------------------------------------------------------------

  listInvoices(businessId: ID) {
    return this.many<Invoice>(
      this.client.from('invoices').select('*').eq('business_id', businessId).order('created_at', { ascending: false }),
    );
  }

  getInvoice(id: ID) {
    return this.one<Invoice>(this.client.from('invoices').select('*').eq('id', id).maybeSingle());
  }

  async upsertInvoice(inv: Partial<Invoice> & { businessId: ID }) {
    const row = toRow(inv);
    if (!inv.id) {
      const { count } = await this.client.from('invoices').select('id', { count: 'exact', head: true }).eq('business_id', inv.businessId);
      row.number = row.number ?? `INV-${(count ?? 0) + 1001}`;
    }
    return (await this.one<Invoice>(this.client.from('invoices').upsert(row).select('*').single()))!;
  }

  async deleteInvoice(id: ID) {
    raise((await this.client.from('invoices').delete().eq('id', id)).error);
  }

  // -- reminders -----------------------------------------------------------

  async getReminderSettings(businessId: ID) {
    return (await this.one<ReminderSettings>(
      this.client.from('reminder_settings').select('*').eq('business_id', businessId).single(),
    ))!;
  }

  async saveReminderSettings(s: ReminderSettings) {
    raise((await this.client.from('reminder_settings').upsert(toRow(s))).error);
  }

  // -- public booking ------------------------------------------------------

  async getPublicBusiness(slug: string) {
    const { data, error } = await this.client.rpc('get_public_business', { p_slug: slug });
    raise(error);
    return (data as PublicBusiness | null) ?? null;
  }

  async getBusyIntervals(slug: string, fromIso: string, toIso: string) {
    const { data, error } = await this.client.rpc('get_busy_intervals', { p_slug: slug, p_from: fromIso, p_to: toIso });
    raise(error);
    return ((data as Row[] | null) ?? []).map((r) => ({
      startsAt: new Date(r.starts_at as string).toISOString(),
      endsAt: new Date(r.ends_at as string).toISOString(),
    }));
  }

  async createPublicBooking(req: PublicBookingRequest): Promise<PublicBookingResult> {
    const { data, error } = await this.client.rpc('create_public_booking', {
      p_slug: req.slug,
      p_service_id: req.serviceId,
      p_starts_at: req.startsAt,
      p_name: req.name,
      p_phone: req.phone,
      p_email: req.email,
      p_notes: req.notes,
    });
    raise(error);
    const result = data as PublicBookingResult;
    if (result.depositCents > 0) {
      // Deposit checkout is created server-side on the business's Stripe account.
      const { data: checkout } = await this.client.functions.invoke('payments', {
        body: { action: 'deposit_checkout', manageToken: result.manageToken },
      });
      result.checkoutUrl = (checkout as { url?: string } | null)?.url ?? null;
    }
    return result;
  }

  async getManagedBooking(token: string) {
    const { data, error } = await this.client.rpc('get_managed_booking', { p_token: token });
    raise(error);
    return (data as ManagedBooking | null) ?? null;
  }

  async cancelManagedBooking(token: string) {
    raise((await this.client.rpc('cancel_managed_booking', { p_token: token })).error);
  }

  async rescheduleManagedBooking(token: string, startsAt: string) {
    raise((await this.client.rpc('reschedule_managed_booking', { p_token: token, p_starts_at: startsAt })).error);
  }

  async submitDeletionRequest(email: string, details: string) {
    raise((await this.client.from('deletion_requests').insert({ email: email.trim().toLowerCase(), details })).error);
  }
}
