/**
 * config.js
 * Sovelluksen globaalit konfiguraatioarvot.
 *
 * Käyttö: import { CONFIG } from '@/constants'
 */

export const CONFIG = {
  // AI-ominaisuudet
  AI_MAX_REQUESTS_PER_DAY: 20,

  // Editori
  MAX_ELEMENTS_PER_DRILL: 200,
  ZOOM_MIN:  0.5,
  ZOOM_MAX:  2.0,
  ZOOM_STEP: 0.1,

  // Tilarajoitukset
  FREE_TIER_MAX_TEAMS:    1,
  FREE_TIER_MAX_SESSIONS: 10,

  // Ajastimet (ms)
  SESSION_AUTOSAVE_INTERVAL: 30000,   // 30 s
  TOAST_DURATION:             2000,   // 2 s

  // Supabase — ladataan ympäristömuuttujista
  SUPABASE_URL:      import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
}
