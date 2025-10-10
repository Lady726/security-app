
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';


const SUPABASE_URL = 'https://njpebblagjsxsjrjhamn.supabase.co'; // Reemplaza con tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcGViYmxhZ2pzeHNqcmpoYW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDcxOTMsImV4cCI6MjA3NTQ4MzE5M30.Psthte5JMx7KtGFMKXepCzgmFYRvXJ7uaWUvufSi8JU'; // Reemplaza con tu key

// Verificación de configuración
if (!SUPABASE_URL || SUPABASE_URL.includes('tu-proyecto')) {
  console.error('⚠️ ERROR: Debes configurar SUPABASE_URL en src/config/supabase.js');
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('tu-anon-key')) {
  console.error('⚠️ ERROR: Debes configurar SUPABASE_ANON_KEY en src/config/supabase.js');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});