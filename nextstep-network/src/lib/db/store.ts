import type { TableName, Tables } from "../types";

export type Row<T extends TableName> = Tables[T];
export type NewRow<T extends TableName> = Omit<Row<T>, "id" | "createdAt"> & { id?: string; createdAt?: string };
export type Where<T extends TableName> = Partial<Row<T>>;

/**
 * Minimal data-access interface used by the whole app.
 * Equality filters only; richer filtering happens in application code.
 * Two implementations: a local JSON file store (development / demos) and Supabase (production).
 */
export interface Store {
  readonly kind: "local" | "supabase";
  all<T extends TableName>(table: T, where?: Where<T>): Promise<Row<T>[]>;
  get<T extends TableName>(table: T, id: string): Promise<Row<T> | null>;
  find<T extends TableName>(table: T, where: Where<T>): Promise<Row<T> | null>;
  insert<T extends TableName>(table: T, row: NewRow<T>): Promise<Row<T>>;
  update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>): Promise<Row<T> | null>;
  remove<T extends TableName>(table: T, where: Where<T>): Promise<number>;
}

export function matches<R>(row: R, where?: Partial<R>): boolean {
  if (!where) return true;
  for (const [k, v] of Object.entries(where)) {
    if (v === undefined) continue;
    if ((row as Record<string, unknown>)[k] !== v) return false;
  }
  return true;
}

export function newId(): string {
  return crypto.randomUUID();
}
