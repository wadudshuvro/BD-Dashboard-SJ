import { createClient } from '@supabase/supabase-js';

const CONTROL_TOWER_URL = import.meta.env.VITE_CONTROL_TOWER_URL || '';
const CONTROL_TOWER_ANON_KEY = import.meta.env.VITE_CONTROL_TOWER_ANON_KEY || '';

export const controlTowerClient = createClient(
  CONTROL_TOWER_URL,
  CONTROL_TOWER_ANON_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
