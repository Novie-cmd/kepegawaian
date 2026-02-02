
import { createClient } from '@supabase/supabase-js';

// Pastikan Anda telah mengatur variabel lingkungan ini di platform deployment Anda
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
