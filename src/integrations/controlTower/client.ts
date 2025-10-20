import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Factory function to create a Control Tower client with dynamic credentials
export const createControlTowerClient = (url: string, anonKey: string): SupabaseClient => {
  return createClient(url, anonKey, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
};

// Default client using environment variables (fallback)
const CONTROL_TOWER_URL = import.meta.env.VITE_CONTROL_TOWER_URL || '';
const CONTROL_TOWER_ANON_KEY = import.meta.env.VITE_CONTROL_TOWER_ANON_KEY || '';

export const controlTowerClient = createControlTowerClient(
  CONTROL_TOWER_URL,
  CONTROL_TOWER_ANON_KEY
);
