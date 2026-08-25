import { createClient } from '@supabase/supabase-js';

export type PasswordSetupMode = 'invite' | 'recovery' | null;

type ViteEnvironment = ImportMeta & {
  env: Record<string, string | undefined>;
};

const environment = (import.meta as ViteEnvironment).env;
const supabaseUrl = environment.VITE_SUPABASE_URL?.trim();
const supabaseKey = (environment.VITE_SUPABASE_PUBLISHABLE_KEY || environment.VITE_SUPABASE_ANON_KEY)?.trim();

const passwordSetupStorageKey = 'quadraplay_password_setup_mode_v1';

const readInitialPasswordSetupMode = (): PasswordSetupMode => {
  if (typeof window === 'undefined') return null;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(window.location.search);
  const urlType = hashParams.get('type') || queryParams.get('type');

  if (urlType === 'invite' || urlType === 'recovery') {
    window.sessionStorage.setItem(passwordSetupStorageKey, urlType);
    return urlType;
  }

  const storedType = window.sessionStorage.getItem(passwordSetupStorageKey);
  return storedType === 'invite' || storedType === 'recovery' ? storedType : null;
};

// Capture the link type before Supabase consumes and removes the auth parameters.
export const initialPasswordSetupMode = readInitialPasswordSetupMode();

export const savePasswordSetupMode = (mode: PasswordSetupMode) => {
  if (typeof window === 'undefined') return;
  if (mode) window.sessionStorage.setItem(passwordSetupStorageKey, mode);
  else window.sessionStorage.removeItem(passwordSetupStorageKey);
};

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
