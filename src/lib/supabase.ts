import { createClient } from '@supabase/supabase-js';

export const isSupabaseConfigured = () => {
  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
  return !!(supabaseUrl && supabaseAnonKey);
};

const getSupabase = () => {
  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL and Anon Key are missing. Supabase features will be disabled.');
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Disable Web Locks synchronization to avoid errors in iframe/multi-tab environments
      lock: (async (name: any, callback: any) => {
        if (typeof callback === 'function') return await callback();
        if (typeof name === 'function') return await name();
        return Promise.resolve();
      }) as any
    }
  });
};

let instance: any = null;

export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (!instance) {
      instance = getSupabase();
    }
    if (!instance) {
      // If accessed but not configured, throw a clear error
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
    }
    return instance[prop];
  }
}) as ReturnType<typeof createClient>;
