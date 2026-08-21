import { createClient } from '@supabase/supabase-js';

type ViteEnvironment = ImportMeta & {
  env: Record<string, string | undefined>;
};

const environment = (import.meta as ViteEnvironment).env;
const supabaseUrl = environment.VITE_SUPABASE_URL?.trim();
const supabaseKey = (environment.VITE_SUPABASE_PUBLISHABLE_KEY || environment.VITE_SUPABASE_ANON_KEY)?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
