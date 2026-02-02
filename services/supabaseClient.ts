
import { createClient } from '@supabase/supabase-js';

// Fungsi bantuan untuk mengambil env dengan aman di browser tanpa crash
const getEnv = (name: string): string | undefined => {
  try {
    // Mengecek apakah window.process ada sebelum mengakses
    if (typeof window !== 'undefined' && (window as any).process?.env) {
      return (window as any).process.env[name];
    }
    // Fallback ke process.env standar (untuk environment bundler)
    return process.env[name];
  } catch {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Inisialisasi client dengan penanganan null
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;
