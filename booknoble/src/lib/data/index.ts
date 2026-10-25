import { Platform } from 'react-native';

import { LocalRepository } from './local';
import type { Repository } from './repository';
import { SupabaseRepository } from './supabase';

export * from './repository';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
// The anon key is designed to be public; Row Level Security protects the data.
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const repo: Repository = url && anonKey ? new SupabaseRepository(url, anonKey) : new LocalRepository();

/**
 * Public web origin used in shareable booking links. Set EXPO_PUBLIC_WEB_URL
 * to the deployed web app; during development on web the current origin is used.
 */
export const WEB_ORIGIN = (
  process.env.EXPO_PUBLIC_WEB_URL ??
  (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'https://booknoble.app')
).replace(/\/$/, '');

export function bookingUrl(slug: string): string {
  return `${WEB_ORIGIN}/b/${slug}`;
}

export function manageUrl(token: string): string {
  return `${WEB_ORIGIN}/manage/${token}`;
}
