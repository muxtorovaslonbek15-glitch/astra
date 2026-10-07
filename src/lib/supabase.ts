import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(import.meta.env['VITE_SUPABASE_URL'] && import.meta.env['VITE_SUPABASE_ANON_KEY']);
}

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      import.meta.env['VITE_SUPABASE_URL'] ?? 'http://localhost',
      import.meta.env['VITE_SUPABASE_ANON_KEY'] ?? 'missing-key',
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
    );
  }
  return client;
}

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  telegram_id: number | null;
  telegram_username: string | null;
  status: 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin';
  created_at: string;
  approved_at: string | null;
};
