
import { createClient } from '@supabase/supabase-js';

// Fungsi helper untuk mengambil environment variable di berbagai platform (Vercel/Local)
const getEnv = (name: string): string | undefined => {
  // Cek di process.env (Vercel Server-side/Build-time)
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  // Cek di import.meta.env (Vite/Modern Bundlers)
  if (typeof (import.meta as any).env !== 'undefined' && (import.meta as any).env[`VITE_${name}`]) {
    return (import.meta as any).env[`VITE_${name}`];
  }
  // Cek di window.process (Shim untuk browser)
  if (typeof window !== 'undefined' && (window as any).process?.env?.[name]) {
    return (window as any).process.env[name];
  }
  return undefined;
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Aplikasi hanya akan masuk ke mode "Cloud" jika kedua kunci ini valid
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'));

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;
