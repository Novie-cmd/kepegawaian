
import { createClient } from '@supabase/supabase-js';

// Fungsi bantuan untuk mengambil env dengan aman di browser
const getEnv = (name: string): string | undefined => {
  try {
    return process.env[name];
  } catch {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Hanya buat client jika parameter tersedia untuk mencegah "Uncaught Error: supabaseUrl is required"
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;
