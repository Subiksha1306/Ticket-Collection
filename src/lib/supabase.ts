import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://htbkrfvxnsnucarwfarg.supabase.co').trim();

// Fallback to the project service role key if environment variable is not injected in Azure or local
const defaultServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0YmtyZnZ4bnNudWNhcndmYXJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQzMTgzMywiZXhwIjoyMTAyMDA3ODMzfQ.-0lPzWsahVjZJMLufexq0PUMn4M_mlWMVvxTWCSZQSM';

const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || defaultServiceKey;
const supabaseServiceKey = (rawKey && rawKey !== 'dummy-key' ? rawKey : defaultServiceKey).trim();

// Ensure we only create the client once
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
