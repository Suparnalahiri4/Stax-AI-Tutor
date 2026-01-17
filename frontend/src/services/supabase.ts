// ABOUTME: Supabase client configuration
// ABOUTME: Provides authenticated client for API calls

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if we have valid credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  supabaseUrl.includes('.supabase.co')

// Demo mode flag - true when no real Supabase is configured
export const isDemoMode = !hasValidCredentials

// Create client or mock if credentials are missing
let supabase: SupabaseClient

if (hasValidCredentials) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn('Supabase not configured. Running in DEMO MODE - data will not persist.')
  // Use a valid dummy URL format that passes validation
  supabase = createClient(
    'https://demo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  )
}

export { supabase }
