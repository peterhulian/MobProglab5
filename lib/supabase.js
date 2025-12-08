import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Your credentials
const supabaseUrl = 'https://cyiprthajpntwewvwbex.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aXBydGhhanBudHdld3Z3YmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NzMwNTAsImV4cCI6MjA3OTM0OTA1MH0.HGZo44zZrxarAQWNCYtQfk10nrI2iUTTck76l1yMmqI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});