import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  if (import.meta.env.DEV) {
    console.warn(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY — ' +
      'Supabase features will fall back to demo data. Set env vars in .env to enable.',
    );
  }
}

// Fallback to dummy URL so createClient doesn't throw at import time.
// All queries will fail gracefully and hooks fall back to DEMO_* data.
const url = SUPABASE_URL || 'https://placeholder.supabase.co';
const key = SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabase = createClient<Database>(url, key, {
  auth: {
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});