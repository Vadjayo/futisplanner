/**
 * supabase.js
 * Supabase-asiakasinstanssi. Alustetaan ympäristömuuttujista.
 * URL ja anonyymi avain luetaan .env-tiedostosta (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Luodaan yksi jaettu asiakasohjelman instanssi — ei luoda uutta joka kutsulle
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
