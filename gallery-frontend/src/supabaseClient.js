import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and public anon key from Vite's environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or anon key is missing. Make sure it's in your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);