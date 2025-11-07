// lib/supabase.js
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// MUST match your Supabase Project URL and Anon Key
const supabaseUrl = 'https://xhiloltocqurxtlmtqtx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWxvbHRvY3F1cnh0bG10cXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NjA4NTgsImV4cCI6MjA3ODAzNjg1OH0.Q6qKB3-DNo3yNH3c4mObu79y8pnDrCxtQqr2Kjo6tw4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Ensures session persistence
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})