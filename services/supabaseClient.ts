
import { createClient } from '@supabase/supabase-js';

const getEnvValue = (keyName: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;

  // Daftar kemungkinan nama env di berbagai platform
  const searchKeys = [
    keyName.toUpperCase(),
    `VITE_${keyName.toUpperCase()}`,
    `NEXT_PUBLIC_${keyName.toUpperCase()}`,
    `REACT_APP_${keyName.toUpperCase()}`
  ];

  for (const key of searchKeys) {
    // 1. Cek import.meta.env (Vite)
    try {
      const metaEnv = (import.meta as any).env;
      if (metaEnv && metaEnv[key]) return metaEnv[key];
    } catch (e) {}

    // 2. Cek process.env (Standard/Webpack)
    try {
      if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
      }
    } catch (e) {}

    // 3. Cek window.process (Shim)
    try {
      if ((window as any).process?.env?.[key]) {
        return (window as any).process.env[key];
      }
    } catch (e) {}
  }
  
  return undefined;
};

const supabaseUrl = getEnvValue('SUPABASE_URL');
const supabaseAnonKey = getEnvValue('SUPABASE_ANON_KEY');

// Fungsi validasi yang lebih ketat
const isValidConfig = (url?: string, key?: string) => {
  if (!url || !key) return false;
  
  // Pastikan bukan nilai placeholder
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
