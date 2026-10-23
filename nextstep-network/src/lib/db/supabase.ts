import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TableName } from "../types";
import { newId, type NewRow, type Row, type Store, type Where } from "./store";

const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function mapKeys(obj: Record<string, unknown>, fn: (k: string) => string) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[fn(k)] = v;
  return out;
}

/**
 * Supabase (PostgreSQL) store. Runs only on the server with the service-role key;
 * the app enforces authorization in server code, and row-level security policies in
 * supabase/migrations block direct access with the public anon key.
 * Only top-level keys are converted between camelCase and snake_case; nested
 * objects are stored as jsonb.
 */
export class SupabaseStore implements Store {
  readonly kind = "supabase" as const;
  private client: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.client = createClient(url, serviceKey, { auth: { persistSession: false } });
  }

  private fromDb<T extends TableName>(r: Record<string, unknown>): Row<T> {
    return mapKeys(r, toCamel) as unknown as Row<T>;
  }

  async all<T extends TableName>(t: T, where?: Where<T>): Promise<Row<T>[]> {
    let q = this.client.from(t).select("*");
    for (const [k, v] of Object.entries(where ?? {})) if (v !== undefined) q = q.eq(toSnake(k), v as never);
    const { data, error } = await q.limit(5000);
    if (error) throw new Error(`[db] ${t}: ${error.message}`);
    return (data ?? []).map((r) => this.fromDb<T>(r));
  }

  async get<T extends TableName>(t: T, id: string) {
    const { data, error } = await this.client.from(t).select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`[db] ${t}: ${error.message}`);
    return data ? this.fromDb<T>(data) : null;
  }

  async find<T extends TableName>(t: T, where: Where<T>) {
    let q = this.client.from(t).select("*");
    for (const [k, v] of Object.entries(where)) if (v !== undefined) q = q.eq(toSnake(k), v as never);
    const { data, error } = await q.limit(1).maybeSingle();
    if (error) throw new Error(`[db] ${t}: ${error.message}`);
    return data ? this.fromDb<T>(data) : null;
  }

  async insert<T extends TableName>(t: T, row: NewRow<T>) {
    const full = { ...row, id: row.id ?? newId(), createdAt: row.createdAt ?? new Date().toISOString() };
    const { data, error } = await this.client.from(t).insert(mapKeys(full, toSnake)).select("*").single();
    if (error) throw new Error(`[db] ${t}: ${error.message}`);
    return this.fromDb<T>(data);
  }

  async update<T extends TableName>(t: T, id: string, patch: Partial<Row<T>>) {
    const { id: _i, createdAt: _c, ...rest } = patch as Record<string, unknown>;
    const { data, error } = await this.client.from(t).update(mapKeys(rest, toSnake)).eq("id", id).select("*").maybeSingle();
    if (error) throw new Error(`[db] ${t}: ${error.message}`);
    return data ? this.fromDb<T>(data) : null;
  }

  async remove<T extends TableName>(t: T, where: Where<T>) {
    const entries = Object.entries(where).filter(([, v]) => v !== undefined);
    if (entries.length === 0) throw new Error("[db] refusing to delete without a filter");
    let q = this.client.from(t).delete({ count: "exact" });
    for (const [k, v] of entries) q = q.eq(toSnake(k), v as never);
    const { count, error } = await q;
    if (error) throw new Error(`[db] ${t}: ${error.message}`);
    return count ?? 0;
  }
}
