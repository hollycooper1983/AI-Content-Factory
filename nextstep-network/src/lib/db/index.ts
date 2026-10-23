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
  if (url && key) return new SupabaseStore(url, key);
  const local = new LocalStore(path.join(process.cwd(), ".data", "db.json"));
  if (local.isEmpty()) await seed(local);
  return local;
}

export function db(): Promise<Store> {
  if (!g.__nsStore) g.__nsStore = create();
  return g.__nsStore;
}

export type { Store } from "./store";
