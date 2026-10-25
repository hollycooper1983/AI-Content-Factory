import AsyncStorage from '@react-native-async-storage/async-storage';

import { defaultReminderSettings, defaultWeeklyHours, randomId, randomToken } from '../defaults';
import type {
  Appointment,
  Availability,
  Business,
  Client,
  ID,
  Invoice,
  ReminderSettings,
  Service,
  TimeOff,
  WeeklyHours,
} from '../types';
import type { NewAppointment, NewBusiness, Repository, Session } from './repository';
import { assertBookable, assertNoConflict, assertWithinPlan, busyFrom, isActive } from './rules';

/**
 * On-device repository used until Supabase is configured. It implements the
 * same rules as the server (conflicts, plan limits, public-page privacy) so
 * the whole product can be exercised in a browser. Nothing is uploaded.
 *
 * Sign-in here only selects a local profile by email; passwords are not
 * stored or checked. Real authentication requires Supabase.
 */
interface LocalDB {
  version: 1;
  session: Session | null;
  accounts: Session[];
  businesses: Business[];
  services: Service[];
  weekly: Record<ID, WeeklyHours[]>;
  timeOff: TimeOff[];
  clients: Client[];
  appointments: Appointment[];
  invoices: Invoice[];
  reminders: Record<ID, ReminderSettings>;
}

const KEY = 'booknoble.local-db.v1';

function emptyDB(): LocalDB {
  return {
    version: 1,
    session: null,
    accounts: [],
    businesses: [],
    services: [],
    weekly: {},
    timeOff: [],
    clients: [],
    appointments: [],
    invoices: [],
    reminders: {},
  };
}

const MINUTE = 60_000;

export class LocalRepository implements Repository {
  readonly mode = 'local' as const;
  private db: LocalDB | null = null;
  private listeners = new Set<(s: Session | null) => void>();

  private async load(): Promise<LocalDB> {
    if (this.db) return this.db;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      this.db = raw ? { ...emptyDB(), ...JSON.parse(raw) } : emptyDB();
    } catch {
      this.db = emptyDB();
    }
    return this.db!;
  }

  private async save() {
    if (this.db) await AsyncStorage.setItem(KEY, JSON.stringify(this.db));
  }

  private async mutate<T>(fn: (db: LocalDB) => T): Promise<T> {
    const db = await this.load();
    const out = fn(db);
    await this.save();
    return out;
  }

  private emit(s: Session | null) {
    this.listeners.forEach((l) => l(s));
  }

  private async requireBusiness(): Promise<Business> {
    const b = await this.getMyBusiness();
    if (!b) throw new Error('Set up your business first.');
    return b;
  }

  // -- auth ----------------------------------------------------------------

  async getSession() {
    return (await this.load()).session;
  }

  onAuthChange(cb: (s: Session | null) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  async signUp(email: string) {
    await this.signIn(email);
    return { needsConfirmation: false };
  }

  async signIn(email: string) {
    const normalized = email.trim().toLowerCase();
    const session = await this.mutate((db) => {
      let acct = db.accounts.find((a) => a.email === normalized);
      if (!acct) {
        acct = { userId: randomId(), email: normalized };
        db.accounts.push(acct);
      }
      db.session = acct;
      return acct;
    });
    this.emit(session);
  }

  async signOut() {
    await this.mutate((db) => {
      db.session = null;
    });
    this.emit(null);
  }

  async resetPassword() {
    // Nothing to reset on-device.
  }

  async deleteAccount() {
    await this.mutate((db) => {
      const s = db.session;
      if (!s) return;
      const owned = new Set(db.businesses.filter((b) => b.ownerId === s.userId).map((b) => b.id));
      db.businesses = db.businesses.filter((b) => !owned.has(b.id));
      db.services = db.services.filter((x) => !owned.has(x.businessId));
      db.timeOff = db.timeOff.filter((x) => !owned.has(x.businessId));
      db.clients = db.clients.filter((x) => !owned.has(x.businessId));
      db.appointments = db.appointments.filter((x) => !owned.has(x.businessId));
      db.invoices = db.invoices.filter((x) => !owned.has(x.businessId));
      owned.forEach((id) => {
        delete db.weekly[id];
        delete db.reminders[id];
      });
      db.accounts = db.accounts.filter((a) => a.userId !== s.userId);
      db.session = null;
    });
    this.emit(null);
  }

  // -- business ------------------------------------------------------------

  async getMyBusiness() {
    const db = await this.load();
    if (!db.session) return null;
    return db.businesses.find((b) => b.ownerId === db.session!.userId) ?? null;
  }

  async isSlugAvailable(slug: string) {
    const db = await this.load();
    const mine = await this.getMyBusiness();
    return !db.businesses.some((b) => b.slug === slug && b.id !== mine?.id);
  }

  async createBusiness(input: NewBusiness) {
    if (!(await this.isSlugAvailable(input.slug))) throw new Error('That booking link is taken. Try another.');
    return this.mutate((db) => {
      if (!db.session) throw new Error('Not signed in');
      const b: Business = {
        id: randomId(),
        ownerId: db.session.userId,
        about: '',
        currency: 'USD',
        plan: 'free',
        bufferMinutes: 0,
        minNoticeMinutes: 120,
        maxAdvanceDays: 60,
        slotStepMinutes: 30,
        cancelWindowHours: 24,
        depositsEnabled: false,
        bookingPageEnabled: true,
        createdAt: new Date().toISOString(),
        ...input,
      };
      db.businesses.push(b);
      db.weekly[b.id] = defaultWeeklyHours();
      db.reminders[b.id] = defaultReminderSettings(b.id);
      return b;
    });
  }

  async updateBusiness(id: ID, patch: Partial<Business>) {
    if (patch.slug && !(await this.isSlugAvailable(patch.slug))) throw new Error('That booking link is taken.');
    return this.mutate((db) => {
      const i = db.businesses.findIndex((b) => b.id === id);
      if (i < 0) throw new Error('Business not found');
      const { id: _id, ownerId: _o, ...safe } = patch;
      db.businesses[i] = { ...db.businesses[i], ...safe };
      return db.businesses[i];
    });
  }

  // -- services ------------------------------------------------------------

  async listServices(businessId: ID) {
    const db = await this.load();
    return db.services.filter((s) => s.businessId === businessId).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async upsertService(s: Partial<Service> & { businessId: ID }) {
    return this.mutate((db) => {
      const existing = s.id ? db.services.findIndex((x) => x.id === s.id) : -1;
      if (existing >= 0) {
        db.services[existing] = { ...db.services[existing], ...s };
        return db.services[existing];
      }
      const created: Service = {
        id: randomId(),
        name: '',
        description: '',
        durationMinutes: 60,
        priceCents: 0,
        depositCents: 0,
        active: true,
        sortOrder: db.services.filter((x) => x.businessId === s.businessId).length,
        ...s,
      };
      db.services.push(created);
      return created;
    });
  }

  async deleteService(id: ID) {
    await this.mutate((db) => {
      // Keep history intact: services with appointments are archived, not removed.
      if (db.appointments.some((a) => a.serviceId === id)) {
        const s = db.services.find((x) => x.id === id);
        if (s) s.active = false;
      } else {
        db.services = db.services.filter((x) => x.id !== id);
      }
    });
  }

  // -- availability --------------------------------------------------------

  async getAvailability(businessId: ID): Promise<Availability> {
    const db = await this.load();
    return {
      weekly: db.weekly[businessId] ?? defaultWeeklyHours(),
      timeOff: db.timeOff.filter((t) => t.businessId === businessId).sort((a, b) => a.startDate.localeCompare(b.startDate)),
    };
  }

  async saveWeeklyHours(businessId: ID, weekly: WeeklyHours[]) {
    await this.mutate((db) => {
      db.weekly[businessId] = weekly;
    });
  }

  async addTimeOff(t: Omit<TimeOff, 'id'>) {
    return this.mutate((db) => {
      const created = { ...t, id: randomId() };
      db.timeOff.push(created);
      return created;
    });
  }

  async deleteTimeOff(id: ID) {
    await this.mutate((db) => {
      db.timeOff = db.timeOff.filter((t) => t.id !== id);
    });
  }

  // -- clients -------------------------------------------------------------

  async listClients(businessId: ID) {
    const db = await this.load();
    return db.clients.filter((c) => c.businessId === businessId).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getClient(id: ID) {
    return (await this.load()).clients.find((c) => c.id === id) ?? null;
  }

  async upsertClient(c: Partial<Client> & { businessId: ID }) {
    return this.mutate((db) => {
      const i = c.id ? db.clients.findIndex((x) => x.id === c.id) : -1;
      if (i >= 0) {
        db.clients[i] = { ...db.clients[i], ...c };
        return db.clients[i];
      }
      const created: Client = {
        id: randomId(),
        name: '',
        phone: '',
        email: '',
        notes: '',
        createdAt: new Date().toISOString(),
        ...c,
      };
      db.clients.push(created);
      return created;
    });
  }

  async deleteClient(id: ID) {
    await this.mutate((db) => {
      db.clients = db.clients.filter((c) => c.id !== id);
      db.appointments = db.appointments.filter((a) => a.clientId !== id);
      db.invoices = db.invoices.filter((i) => i.clientId !== id);
    });
  }

  // -- appointments --------------------------------------------------------

  async listAppointments(businessId: ID, fromIso: string, toIso: string) {
    const db = await this.load();
    return db.appointments
      .filter((a) => a.businessId === businessId && a.endsAt > fromIso && a.startsAt < toIso)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  async listClientAppointments(clientId: ID) {
    const db = await this.load();
    return db.appointments.filter((a) => a.clientId === clientId).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  }

  async getAppointment(id: ID) {
    return (await this.load()).appointments.find((a) => a.id === id) ?? null;
  }

  async createAppointment(a: NewAppointment) {
    const business = await this.requireBusiness();
    const db = await this.load();
    const service = db.services.find((s) => s.id === a.serviceId);
    if (!service) throw new Error('Choose a service');
    const mine = db.appointments.filter((x) => x.businessId === a.businessId);
    assertWithinPlan(business, mine);
    const endsAt = new Date(Date.parse(a.startsAt) + service.durationMinutes * MINUTE).toISOString();
    assertNoConflict({ startsAt: a.startsAt, endsAt }, mine, business.bufferMinutes);
    return this.mutate((d) => {
      const created: Appointment = {
        id: randomId(),
        status: 'confirmed',
        source: 'owner',
        depositStatus: a.depositCents > 0 ? 'due' : 'none',
        manageToken: randomToken(),
        createdAt: new Date().toISOString(),
        endsAt,
        ...a,
      };
      d.appointments.push(created);
      return created;
    });
  }

  async updateAppointment(id: ID, patch: Partial<Appointment>) {
    const db = await this.load();
    const current = db.appointments.find((a) => a.id === id);
    if (!current) throw new Error('Appointment not found');
    const next = { ...current, ...patch };
    if (patch.startsAt || patch.serviceId) {
      const service = db.services.find((s) => s.id === next.serviceId);
      const duration = service?.durationMinutes ?? (Date.parse(current.endsAt) - Date.parse(current.startsAt)) / MINUTE;
      next.endsAt = new Date(Date.parse(next.startsAt) + duration * MINUTE).toISOString();
      const business = db.businesses.find((b) => b.id === current.businessId)!;
      if (isActive(next)) {
        assertNoConflict(
          next,
          db.appointments.filter((a) => a.businessId === current.businessId),
          business.bufferMinutes,
          id,
        );
      }
    }
    if (patch.status && isActive(next) && !isActive(current)) {
      const business = db.businesses.find((b) => b.id === current.businessId)!;
      assertNoConflict(next, db.appointments.filter((a) => a.businessId === current.businessId), business.bufferMinutes, id);
    }
    return this.mutate((d) => {
      const i = d.appointments.findIndex((a) => a.id === id);
      d.appointments[i] = next;
      return next;
    });
  }

  // -- invoices ------------------------------------------------------------

  async listInvoices(businessId: ID) {
    const db = await this.load();
    return db.invoices.filter((i) => i.businessId === businessId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getInvoice(id: ID) {
    return (await this.load()).invoices.find((i) => i.id === id) ?? null;
  }

  async upsertInvoice(inv: Partial<Invoice> & { businessId: ID }) {
    return this.mutate((db) => {
      const i = inv.id ? db.invoices.findIndex((x) => x.id === inv.id) : -1;
      if (i >= 0) {
        db.invoices[i] = { ...db.invoices[i], ...inv };
        return db.invoices[i];
      }
      const count = db.invoices.filter((x) => x.businessId === inv.businessId).length;
      const created: Invoice = {
        id: randomId(),
        clientId: '',
        appointmentId: null,
        number: `INV-${String(count + 1001)}`,
        lines: [],
        taxRateBps: 0,
        status: 'draft',
        dueDate: new Date().toISOString().slice(0, 10),
        notes: '',
        paymentUrl: null,
        createdAt: new Date().toISOString(),
        paidAt: null,
        ...inv,
      };
      db.invoices.push(created);
      return created;
    });
  }

  async deleteInvoice(id: ID) {
    await this.mutate((db) => {
      db.invoices = db.invoices.filter((i) => i.id !== id);
    });
  }

  // -- reminders -----------------------------------------------------------

  async getReminderSettings(businessId: ID) {
    const db = await this.load();
    return db.reminders[businessId] ?? defaultReminderSettings(businessId);
  }

  async saveReminderSettings(s: ReminderSettings) {
    await this.mutate((db) => {
      db.reminders[s.businessId] = s;
    });
  }

  // -- public booking ------------------------------------------------------

  private async publicBusiness(slug: string) {
    const db = await this.load();
    const b = db.businesses.find((x) => x.slug === slug && x.bookingPageEnabled);
    return b ? { db, b } : null;
  }

  async getPublicBusiness(slug: string) {
    const found = await this.publicBusiness(slug);
    if (!found) return null;
    const { b } = found;
    return {
      business: {
        id: b.id,
        name: b.name,
        slug: b.slug,
        industry: b.industry,
        about: b.about,
        address: b.address,
        timezone: b.timezone,
        currency: b.currency,
        bufferMinutes: b.bufferMinutes,
        minNoticeMinutes: b.minNoticeMinutes,
        maxAdvanceDays: b.maxAdvanceDays,
        slotStepMinutes: b.slotStepMinutes,
        cancelWindowHours: b.cancelWindowHours,
        depositsEnabled: b.depositsEnabled,
      },
      services: (await this.listServices(b.id)).filter((s) => s.active),
      availability: await this.getAvailability(b.id),
    };
  }

  async getBusyIntervals(slug: string, fromIso: string, toIso: string) {
    const found = await this.publicBusiness(slug);
    if (!found) return [];
    return busyFrom(await this.listAppointments(found.b.id, fromIso, toIso));
  }

  async createPublicBooking(req: Parameters<Repository['createPublicBooking']>[0]) {
    const found = await this.publicBusiness(req.slug);
    if (!found) throw new Error('This booking page is not available.');
    const { db, b } = found;
    const service = db.services.find((s) => s.id === req.serviceId && s.businessId === b.id && s.active);
    if (!service) throw new Error('That service is no longer offered.');
    const mine = db.appointments.filter((a) => a.businessId === b.id);
    assertWithinPlan(b, mine);
    assertBookable(b, await this.getAvailability(b.id), mine, req.startsAt, service.durationMinutes);

    const email = req.email.trim().toLowerCase();
    const appt = await this.mutate((d) => {
      let client = d.clients.find((c) => c.businessId === b.id && ((email && c.email === email) || (req.phone && c.phone === req.phone)));
      if (!client) {
        client = {
          id: randomId(),
          businessId: b.id,
          name: req.name.trim(),
          phone: req.phone.trim(),
          email,
          notes: '',
          createdAt: new Date().toISOString(),
        };
        d.clients.push(client);
      }
      const deposit = b.depositsEnabled ? service.depositCents : 0;
      const created: Appointment = {
        id: randomId(),
        businessId: b.id,
        serviceId: service.id,
        clientId: client.id,
        startsAt: new Date(req.startsAt).toISOString(),
        endsAt: new Date(Date.parse(req.startsAt) + service.durationMinutes * MINUTE).toISOString(),
        status: 'confirmed',
        source: 'booking_page',
        priceCents: service.priceCents,
        depositCents: deposit,
        depositStatus: deposit > 0 ? 'due' : 'none',
        notes: req.notes.trim(),
        manageToken: randomToken(),
        createdAt: new Date().toISOString(),
      };
      d.appointments.push(created);
      return created;
    });
    return {
      appointmentId: appt.id,
      manageToken: appt.manageToken,
      startsAt: appt.startsAt,
      endsAt: appt.endsAt,
      depositCents: appt.depositCents,
      checkoutUrl: null,
    };
  }

  async getManagedBooking(token: string) {
    const db = await this.load();
    const a = db.appointments.find((x) => x.manageToken === token);
    if (!a) return null;
    const b = db.businesses.find((x) => x.id === a.businessId)!;
    const s = db.services.find((x) => x.id === a.serviceId);
    return {
      appointment: {
        id: a.id,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        status: a.status,
        depositCents: a.depositCents,
        depositStatus: a.depositStatus,
      },
      serviceId: a.serviceId,
      serviceName: s?.name ?? 'Appointment',
      businessName: b.name,
      slug: b.slug,
      cancelWindowHours: b.cancelWindowHours,
    };
  }

  private async managed(token: string) {
    const db = await this.load();
    const a = db.appointments.find((x) => x.manageToken === token);
    if (!a || !isActive(a)) throw new Error('This booking can no longer be changed online.');
    const b = db.businesses.find((x) => x.id === a.businessId)!;
    if (Date.parse(a.startsAt) - Date.now() < b.cancelWindowHours * 60 * MINUTE) {
      throw new Error(`Changes must be made at least ${b.cancelWindowHours} hours ahead. Please contact ${b.name}.`);
    }
    return { db, a, b };
  }

  async cancelManagedBooking(token: string) {
    const { a } = await this.managed(token);
    await this.mutate((d) => {
      const x = d.appointments.find((y) => y.id === a.id)!;
      x.status = 'cancelled';
    });
  }

  async rescheduleManagedBooking(token: string, startsAt: string) {
    const { db, a, b } = await this.managed(token);
    const service = db.services.find((s) => s.id === a.serviceId)!;
    const mine = db.appointments.filter((x) => x.businessId === b.id);
    assertBookable(b, await this.getAvailability(b.id), mine, startsAt, service.durationMinutes, a.id);
    await this.mutate((d) => {
      const x = d.appointments.find((y) => y.id === a.id)!;
      x.startsAt = new Date(startsAt).toISOString();
      x.endsAt = new Date(Date.parse(startsAt) + service.durationMinutes * MINUTE).toISOString();
    });
  }

  async submitDeletionRequest() {
    // Demo mode has no server; on-device data is removed via Settings → Delete account.
  }

  // -- demo data -----------------------------------------------------------

  /** Development only: wipes this device's BookNoble data. */
  async resetAll() {
    this.db = emptyDB();
    await this.save();
    this.emit(null);
  }
}
