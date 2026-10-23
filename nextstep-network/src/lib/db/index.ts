import "server-only";
import path from "node:path";
import { LocalStore } from "./local";
import { SupabaseStore } from "./supabase";
import type { Store } from "./store";
import { seed } from "../seed";

const g = globalThis as unknown as { __nsStore?: Promise<Store> };

async function create(): Promise<Store> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const store: Store = url && key ? new SupabaseStore(url, key) : new LocalStore(path.join(process.cwd(), ".data", "db.json"));
  // Seed clearly labeled demonstration data into an empty database unless demo mode is off.
  if (process.env.DEMO_MODE !== "false" && (await store.all("users")).length === 0) await seed(store);
  return store;
}

export function db(): Promise<Store> {
  if (!g.__nsStore) g.__nsStore = create().catch((e) => { g.__nsStore = undefined; throw e; });
  return g.__nsStore;
}

export type { Store } from "./store";
