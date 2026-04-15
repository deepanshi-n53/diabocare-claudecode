import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const SUPABASE_URL = "https://ssprnjnztrrwkfdenylz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcHJuam56dHJyd2tmZGVueWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjE3NjUsImV4cCI6MjA5MTYzNzc2NX0.5LFw-atcIbNvu6gwqBV-sRU5P7v9dLLJqmr2ZQkiWko";

// On web, leave storage undefined so Supabase uses localStorage by default.
// AsyncStorage doesn't reliably persist sessions in a browser environment.
const authStorage = Platform.OS === 'web' ? undefined : (AsyncStorage as any);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

export type Profile = {
  id: string;
  full_name: string | null;
  diabetes_type: 'type1' | 'type2' | 'gestational' | 'prediabetes' | null;
  language: string | null;
  age: number | null;
  target_range_min: number | null;
  target_range_max: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  streak_count: number | null;
  created_at: string;
  updated_at: string | null;
};
