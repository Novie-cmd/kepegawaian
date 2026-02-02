
import { createClient } from '@supabase/supabase-js';

const getEnv = (name: string): string | undefined => {
  // 1. Cek prefix umum (VITE_ atau NEXT_PUBLIC_)
  const prefixes = ['', 'VITE_', 'NEXT_PUBLIC_'];
  
  for (const prefix of prefixes) {
    const fullName = `${prefix}${name}`;
    
    // Cek di process.env (Vercel Build/Node context)
    try {
      if (typeof process !== 'undefined' && process.env && process.env[fullName]) {
        return process.env[fullName];
      }
    } catch (e) {}

    // Cek di import.meta.env (Vite context)
    try {
      const metaEnv = (import.meta as any).env;
      if (metaEnv && metaEnv[fullName]) {
        return metaEnv[fullName];
      }
    } catch (e) {}

    // Cek di window.process (Shim context)
    try {
      const winProcess = (window as any).process;
      if (winProcess?.env?.[fullName]) {
        return winProcess.env[fullName];
      }
    } catch (e) {}
  }
  
  return undefined;
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Logging untuk membantu debugging di Console (F12)
if (typeof window !== 'undefined') {
  console.log('--- Database Status Check ---');
  console.log('URL Found:', supabaseUrl ? 'Yes (Starts with ' + supabaseUrl.substring(0, 10) + '...)' : 'No');
  console.log('Key Found:', supabaseAnonKey ? 'Yes' : 'No');
}

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('supabase.co')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;
