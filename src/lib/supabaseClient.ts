import { createClient } from '@supabase/supabase-js';
import { config } from '@/config/env';

if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in the .env file');
}

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Adicionado para garantir que o cliente Supabase seja exportado corretamente
export default supabase;
