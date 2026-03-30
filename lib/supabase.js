import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Your credentials
const supabaseUrl = 'https://estptdfhjqmtgmeuzsoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdHB0ZGZoanFtdGdtZXV6c29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjUzNzcsImV4cCI6MjA5MDMwMTM3N30.NPM-047QkB2KvN5uQ84MPIeKxQEHpgh7h0Cd5joR1rQ';
                        
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});