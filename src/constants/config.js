/**
 * config.js
 * Sovelluksen globaalit konfiguraatioarvot.
 */

// Supabase — ladataan ympäristömuuttujista
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Kanvas
export const CANVAS_SCALE = 1
export const CANVAS_FIELD_RATIO = 0.68  // kenttä on 68 % leveydestä

// Debounce-ajat (ms)
export const AUTOSAVE_DELAY = 1000
export const TOAST_DURATION = 2500

// PDF-vienti
export const PDF_PAGE_FORMAT = 'a4'
export const PDF_ORIENTATION = 'landscape'

// App-versio
export const APP_VERSION = '0.1.0'
