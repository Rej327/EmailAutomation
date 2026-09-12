import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project-id.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("your-project-id") &&
  !supabaseAnonKey.includes("placeholder");

// Create Supabase client
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://dummy-placeholder.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "dummy-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export interface MockUser {
  id: string;
  email: string;
  username: string;
  name?: string;
  isMock: boolean;
}
