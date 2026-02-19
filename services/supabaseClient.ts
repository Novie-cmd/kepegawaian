
import { createClient } from '@supabase/supabase-js';

const getEnvValue = (keyName: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;

  const searchKeys = [
    keyName.toUpperCase(),
    `VITE_${keyName.toUpperCase()}`,
    `NEXT_PUBLIC_${keyName.toUpperCase()}`
  ];

  for (const key of searchKeys) {
    try {
      // Cek import.meta.env
      const metaEnv = (import.meta as any).env;
      if (metaEnv && metaEnv[key]) return metaEnv[key];
    } catch (e) {}

    try {
      // Cek process.env
      if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
      }
    } catch (e) {}
  }
  
  return undefined;
};

const supabaseUrl = getEnvValue('SUPABASE_URL');
const supabaseAnonKey = getEnvValue('SUPABASE_ANON_KEY');

// Fungsi untuk mengecek apakah key adalah placeholder atau valid
const isValidConfig = (url?: string, key?: string) => {
  if (!url || !key) return false;
  const isPlaceholder = 
    url.includes('your-project') || 
    url.includes('YOUR_') || 
    key.includes('your-anon-key') || 
    key.includes('YOUR_');
  
  return !isPlaceholder && url.startsWith('https://');
};

export const isSupabaseConfigured = isValidConfig(supabaseUrl, supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;
