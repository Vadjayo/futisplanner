// Supabase-asiakasohjelman alustus — käytetään kaikissa tietokantakutsuissa
// URL ja anonyymi avain luetaan ympäristömuuttujista (.env-tiedostosta)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Luodaan yksi jaettu asiakasohjelman instanssi — ei luoda uutta joka kutsulle
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
