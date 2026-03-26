/**
 * lib/supabase.js
 * Re-exporttaa services/supabase.js:n singletonin.
 * lib/db.js ja lib/seasonDb.js käyttävät tätä — näin kaikki koodi jakaa
 * saman Supabase-instanssin eikä kirjautumissessio katoa.
 */

export { supabase } from '../services/supabase'
