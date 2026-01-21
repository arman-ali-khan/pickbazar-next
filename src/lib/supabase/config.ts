// IMPORTANT: Replace these placeholder values with your actual Supabase credentials.
// You can find them in your Supabase project's API settings:
// https://supabase.com/dashboard/project/_/settings/api

const SUPABASE_URL_PLACEHOLDER = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY_PLACEHOLDER = 'your-anon-key';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_PLACEHOLDER;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_PLACEHOLDER;

export const isSupabaseConfigured =
  supabaseUrl !== SUPABASE_URL_PLACEHOLDER &&
  supabaseAnonKey !== SUPABASE_ANON_KEY_PLACEHOLDER;
