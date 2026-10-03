import 'react-native-url-polyfill/auto';
import { createClient, processLock } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://cdgavcikyyxaydroihwp.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZ2F2Y2lreXl4YXlkcm9paHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTkwMTMsImV4cCI6MjEwMzU3NTAxM30.eC9S-QzKF9k1iFeaF0byIx1WPwf9020BGqVZ6iiDunU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});
