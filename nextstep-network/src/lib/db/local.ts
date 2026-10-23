import fs from "node:fs";
import path from "node:path";
import type { TableName, Tables } from "../types";
import { matches, newId, type NewRow, type Row, type Store, type Where } from "./store";

type Data = { [K in TableName]?: Tables[K][] };

/**
 * JSON-file store for local development and demos. Data lives in `.data/db.json`.
 * Not suitable for serverless production hosting (read-only filesystems, no concurrency control).
 */
export class LocalStore implements Store {
  readonly kind = "local" as const;
  private data: Data;

  constructor(private file: string | null) {
    this.data = {};
    if (file && fs.existsSync(file)) {
      this.data = JSON.parse(fs.readFileSync(file, "utf8")) as Data;
    }
  }

  private table<T extends TableName>(t: T): Tables[T][] {
    if (!this.data[t]) (this.data as Record<string, unknown[]>)[t] = [];
    return this.data[t] as Tables[T][];
  }

  private persist() {
    if (!this.file) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = this.file + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(this.data));
    fs.renameSync(tmp, this.file);
  }

  isEmpty() {
    return !this.data.users || this.data.users.length === 0;
  }

  async all<T extends TableName>(t: T, where?: Where<T>): Promise<Row<T>[]> {
    return structuredClone(this.table(t).filter((r) => matches(r, where)));
  }

  async get<T extends TableName>(t: T, id: string): Promise<Row<T> | null> {
    const r = this.table(t).find((x) => x.id === id);
    return r ? structuredClone(r) : null;
  }

  async find<T extends TableName>(t: T, where: Where<T>): Promise<Row<T> | null> {
    const r = this.table(t).find((x) => matches(x, where));
    return r ? structuredClone(r) : null;
  }

  async insert<T extends TableName>(t: T, row: NewRow<T>): Promise<Row<T>> {
    const full = { ...row, id: row.id ?? newId(), createdAt: row.createdAt ?? new Date().toISOString() } as Row<T>;
    this.table(t).push(full);
    this.persist();
    return structuredClone(full);
  }

  async update<T extends TableName>(t: T, id: string, patch: Partial<Row<T>>): Promise<Row<T> | null> {
    const rows = this.table(t);
    const i = rows.findIndex((x) => x.id === id);
    if (i < 0) return null;
    rows[i] = { ...rows[i], ...patch, id: rows[i].id, createdAt: rows[i].createdAt };
    this.persist();
    return structuredClone(rows[i]);
  }

  async remove<T extends TableName>(t: T, where: Where<T>): Promise<number> {
    const rows = this.table(t);
    const keep = rows.filter((r) => !matches(r, where));
    const removed = rows.length - keep.length;
    (this.data as Record<string, unknown[]>)[t] = keep;
    if (removed) this.persist();
    return removed;
  }
}
