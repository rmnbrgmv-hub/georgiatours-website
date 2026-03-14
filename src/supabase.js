import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mmwrdmevsrcwytrrdqis.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6XIXdn8ZHLJbXvfSKswyLw_AvNIia-J'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
