
import { createClient } from '@supabase/supabase-js';

/**
 * Fungsi pencarian variabel lingkungan yang sangat kuat (Robust)
 * Mencari di: process.env, import.meta.env, dan window.process.env
 * Mendukung variasi: ORIGINAL, VITE_, NEXT_PUBLIC_
 * Mendukung: Huruf BESAR dan huruf kecil
 */
const getEnvValue = (keyName: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;

  const searchKeys = [
    keyName.toUpperCase(),
    keyName.toLowerCase(),
    `VITE_${keyName.toUpperCase()}`,
    `VITE_${keyName.toLowerCase()}`,
    `NEXT_PUBLIC_${keyName.toUpperCase()}`,
    `NEXT_PUBLIC_${keyName.toLowerCase()}`
  ];

  for (const key of searchKeys) {
    // 1. Cek di import.meta.env (Standar Vite)
    try {
      const metaEnv = (import.meta as any).env;
      if (metaEnv && metaEnv[key]) return metaEnv[key];
    } catch (e) {}

    // 2. Cek di process.env (Vercel/Node)
    try {
      if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
      }
    } catch (e) {}

    // 3. Cek di window.process.env (Shim)
    try {
      const winProcess = (window as any).process;
      if (winProcess?.env?.[key]) return winProcess.env[key];
    } catch (e) {}
    
    // 4. Cek langsung di window jika ada global injection
    try {
      if ((window as any)[key]) return (window as any)[key];
    } catch (e) {}
  }
  
  return undefined;
};

// Ambil nilai dengan toleransi nama variabel
const supabaseUrl = getEnvValue('SUPABASE_URL');
const supabaseAnonKey = getEnvValue('SUPABASE_ANON_KEY');

// Diagnostik untuk Console (F12)
if (typeof window !== 'undefined') {
  console.group('--- HR-Pro Database Connection Check ---');
  console.log('Target URL Variable:', supabaseUrl ? 'FOUND ✅' : 'NOT FOUND ❌');
  console.log('Target Key Variable:', supabaseAnonKey ? 'FOUND ✅' : 'NOT FOUND ❌');
  if (supabaseUrl) console.log('URL Prefix:', supabaseUrl.substring(0, 15) + '...');
  console.groupEnd();
}

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;
