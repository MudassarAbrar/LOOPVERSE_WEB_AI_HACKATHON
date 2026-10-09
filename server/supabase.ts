import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kzbcrlndszsybpjcyuez.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[SUPABASE WARNING] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment.');
}

// Client for general authenticated/anon requests
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client bypassing RLS for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
