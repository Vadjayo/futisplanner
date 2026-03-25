/**
 * services/supabase.js
 * Supabase-asiakasinstanssi. Kaikkien serviceiden yhteinen yhteys.
 * Alustetaan kerran — ei luoda uutta instanssia joka kutsulle.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase-ympäristömuuttujat puuttuvat. ' +
    'Tarkista VITE_SUPABASE_URL ja VITE_SUPABASE_ANON_KEY .env-tiedostosta.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
