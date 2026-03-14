import { createClient } from '@supabase/supabase-js'

// Use the same Supabase project as the GeorgiaTours app so tours, users, and bookings are shared.
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to your app's project (or leave unset if using the same default).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mmwrdmevsrcwytrrdqis.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6XIXdn8ZHLJbXvfSKswyLw_AvNIia-J'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
