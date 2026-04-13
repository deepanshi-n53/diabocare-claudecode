import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = "https://ssprnjnztrrwkfdenylz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcHJuam56dHJyd2tmZGVueWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjE3NjUsImV4cCI6MjA5MTYzNzc2NX0.5LFw-atcIbNvu6gwqBV-sRU5P7v9dLLJqmr2ZQkiWko";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Profile = {
  id: string;
  name: string;
  diabetes_type: string | null;
  language: string;
  created_at: string;
};
