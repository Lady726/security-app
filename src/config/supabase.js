// src/config/supabase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'TU_SUPABASE_URL'; // Reemplaza con tu URL
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY'; // Reemplaza con tu key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});