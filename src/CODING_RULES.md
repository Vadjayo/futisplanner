## FUTISPLANNER — KOODAUSSÄÄNNÖT
## Liitä tämä jokaisen promptin alkuun
## Päivitetty: 26.3.2026

==============================================
## OSA 1: ARKKITEHTUURISÄÄNNÖT
==============================================

### Tiedostojen vastuut — ei poikkeuksia
src/services/   → kaikki Supabase-kutsut
src/hooks/      → tila, logiikka, sivuvaikutukset
src/components/ → UI-komponentit, ei logiikkaa
src/pages/      → sivut, kokoaa komponentit yhteen
src/utils/      → apufunktiot, ei React-koodia
src/constants/  → värit, reitit, konfiguraatio

### Tietokantakyselyt — ei koskaan komponenttiin
❌ VÄÄRIN:
const MyPage = () => {
  useEffect(() => {
    const { data } = await supabase
      .from('sessions').select('*')
  }, [])
}

✅ OIKEIN — kolme kerrosta aina:
// 1. services/ — kysely
export const getSessions = async (userId, teamId) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Harjoitusten haku epäonnistui:', error)
    return { data: null, error }
  }
}

// 2. hooks/ — tila ja logiikka
export const useSessions = (teamId) => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id || !teamId) return
    getSessions(user.id, teamId)
      .then(({ data, error }) => {
        if (error) setError(error)
        else setSessions(data ?? [])
        setLoading(false)
      })
  }, [user?.id, teamId])

  return { sessions, loading, error }
}

// 3. pages/ tai components/ — vain UI
const MyPage = () => {
  const { sessions, loading } = useSessions(team?.id)
  if (loading) return <LoadingSpinner />
  return <div>...</div>
}

### Komponentti SAA sisältää
✅ useState paikalliselle UI-tilalle
✅ Custom hookkien kutsuminen
✅ JSX — mitä näytetään
✅ Event handlerit jotka kutsuvat hookeja

### Komponentti EI SAA sisältää
❌ supabase.from() kutsuja
❌ fetch() tai axios() kutsuja
❌ Suoraa tietokantalogiikkaa
❌ try/catch tietokantaoperaatioille
❌ Kopioitua koodia muista komponenteista

### Ennen kuin luot uutta — tarkista ensin
1. Onko services/:ssa jo vastaava funktio?
   → Jos on: käytä sitä, älä luo uutta
2. Onko hooks/:ssa jo vastaava hook?
   → Jos on: käytä sitä, älä luo uutta
3. Onko components/ui/:ssa jo vastaava komponentti?
   → Jos on: käytä sitä, älä luo uutta

==============================================
## OSA 2: KOODAUSTYYLI
==============================================

### Kieli
- Kaikki kommentit: suomeksi
- Muuttujat, funktiot, tiedostot: englanniksi
- Käyttäjälle näkyvät tekstit: suomeksi
- Console.error-viestit: suomeksi

### JSDoc — jokaisen funktion yläpuolelle
/**
 * Hakee käyttäjän harjoitukset joukkueittain
 *
 * @param {string} userId - Käyttäjän Supabase UUID
 * @param {string} teamId - Joukkueen UUID
 * @returns {Promise<{data: Session[], error: Error}>}
 */
export const getSessions = async (userId, teamId) => { }

### Nimeämiskäytännöt
Tiedostot:
  Komponentit:  PascalCase.jsx  (DrillCard.jsx)
  Hookit:       camelCase.js    (useSessions.js)
  Servicet:     camelCase.js    (sessionService.js)
  Utilit:       camelCase.js    (dateUtils.js)

Muuttujat:
  Vakiot:       UPPER_SNAKE_CASE  (MAX_PLAYERS)
  Muuttujat:    camelCase         (currentTeam)
  Komponentit:  PascalCase        (DrillCard)
  Hookit:       useX              (useSessions)
  Servicet:     verbX             (getSessions, saveSession)

### Funktioiden nimeäminen
Servicet:
  getX()      → hae dataa
  saveX()     → luo tai päivitä (upsert)
  updateX()   → päivitä olemassa oleva
  deleteX()   → poista
  createX()   → luo uusi

Event handlerit:
  handleX()   → handle + tapahtuma
  onX()       → prop-nimet

### Importtien järjestys
// 1. React
import { useState, useEffect } from 'react'

// 2. Kirjastot
import { useNavigate } from 'react-router-dom'

// 3. Omat hookit
import { useAuth } from '../hooks/useAuth'

// 4. Omat servicet
import { getSessions } from '../services/sessionService'

// 5. Omat komponentit
import Button from '../components/ui/Button'

// 6. Vakiot
import { COLORS, ROUTES } from '../constants'

// 7. Tyylit
import styles from './MyPage.module.css'

==============================================
## OSA 3: VIRHEENKÄSITTELY
==============================================

### Services palauttavat aina { data, error }
// ✅ OIKEIN
export const saveSession = async (sessionData) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .upsert(sessionData)
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Harjoituksen tallennus epäonnistui:', error)
    return { data: null, error }
  }
}

### Hookit käsittelevät virheen
const { data, error } = await saveSession(session)
if (error) {
  showToast('Tallennus epäonnistui', 'error')
  return
}
showToast('Tallennettu!', 'success')

### Tyhjä tila — aina käsiteltävä
// Kolme tilaa joka komponentissa
if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
if (!data?.length) return <EmptyState />
return <ActualContent />

### Poistot — aina vahvistus
// Älä koskaan poista suoraan
// Käytä aina Modal-komponenttia
const handleDelete = () => {
  setDeleteModal({
    isOpen: true,
    title: 'Poistetaanko harjoitus?',
    message: 'Tätä toimintoa ei voi peruuttaa.',
    onConfirm: () => deleteSession(session.id)
  })
}

==============================================
## OSA 4: SUORITUSKYKY
==============================================

### Promise.all rinnakkaisille hauille
// ❌ HIDAS — 3 sekuntia
const sessions = await getSessions(userId)
const events = await getSeasonEvents(userId)
const team = await getTeam(userId)

// ✅ NOPEA — 1 sekunti
const [sessions, events, team] = await Promise.all([
  getSessions(userId),
  getSeasonEvents(userId),
  getTeam(userId)
])

### useCallback ja useMemo
// Käytä kun funktio menee proppina lapselle
const handleSave = useCallback(async () => {
  await saveSession(currentSession)
}, [currentSession])

// Käytä kun laskenta on raskas
const totalDuration = useMemo(() =>
  drills.reduce((sum, d) => sum + d.duration, 0),
  [drills]
)

### Älä hae turhaa dataa
// ❌ VÄÄRIN — hakee kaiken
.select('*')

// ✅ OIKEIN — hakee vain tarvittavan
.select('id, title, duration, updated_at')

==============================================
## OSA 5: TIETOTURVA
==============================================

### RLS — Row Level Security aina päällä
-- Jokainen uusi taulu vaatii RLS-policyn
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own data"
  ON new_table FOR ALL
  USING (auth.uid() = user_id);

### Ympäristömuuttujat
// ✅ OIKEIN
const url = import.meta.env.VITE_SUPABASE_URL

// ❌ VÄÄRIN — ei koskaan kovakoodattuna
const url = 'https://abc123.supabase.co'

### API-avaimet
// Claude API-avain EI koskaan React-koodiin
// Aina serverless proxy:n kautta
// api/ai.js — Vercelin serverless funktio
const apiKey = process.env.ANTHROPIC_API_KEY

### user_id aina kyselyissä
// Estä käyttäjiä näkemästä toistensa dataa
.eq('user_id', user.id)  // ← aina mukaan

==============================================
## OSA 6: KOMPONENTIT
==============================================

### Uudelleenkäytettävät UI-komponentit
// Käytä aina olemassa olevia:
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Toast from '../components/ui/Toast'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'

// ❌ VÄÄRIN — älä luo omia nappeja
<button style={{background:'#1D9E75'}}>Tallenna</button>

// ✅ OIKEIN
<Button variant="primary" onClick={handleSave}>
  Tallenna
</Button>

### Props — selkeät tyypit
/**
 * @param {string} variant - 'primary'|'ghost'|'danger'
 * @param {string} size - 'sm'|'md'|'lg'
 * @param {boolean} loading - Näyttää spinnerin
 * @param {function} onClick - Klikkauksen käsittelijä
 */

### Vakiot komponenteissa
// ❌ VÄÄRIN — väri suoraan koodissa
color: '#1D9E75'

// ✅ OIKEIN — vakiosta
import { COLORS } from '../constants/colors'
color: COLORS.brand.primary

==============================================
## OSA 7: TESTAUS
==============================================

### Mitä testataan
✅ Kaikki util-funktiot (validators, dateUtils)
✅ Service-funktiot (mock Supabase)
✅ Kriittiset hookit (useAuth)
✅ UI-komponentit (Button, Modal)

### Testien nimeäminen
describe('getSessions', () => {
  it('palauttaa tyhjän arrayn jos ei harjoituksia', ...)
  it('palauttaa virheen jos haku epäonnistuu', ...)
  it('hakee vain kirjautuneen käyttäjän data', ...)
})

### Aja testit ennen commitia
npm run test

==============================================
## OSA 8: GIT
==============================================

### Commit-viestit aina näin
feat:     uusi ominaisuus
fix:      bugikorjaus
refactor: koodin uudelleenjärjestely
test:     testien lisääminen
docs:     dokumentaation päivitys
style:    tyylien muutos
chore:    konfiguraatio, riippuvuudet

Esimerkkejä:
feat: add AI assistant panel to drill editor
fix: prevent duplicate team creation in Supabase
refactor: extract session queries to sessionService
test: add unit tests for dateUtils
docs: update README with deployment instructions

### Ennen jokaista isoa muutosta
git add .
git commit -m "feat: ennen [ominaisuuden nimi]"

==============================================
## OSA 9: ENNEN KUIN VASTAAT
==============================================

Tarkista aina ennen koodin kirjoittamista:

1. Onko vastaava service jo olemassa?
   → src/services/ kansio

2. Onko vastaava hook jo olemassa?
   → src/hooks/ kansio

3. Onko vastaava UI-komponentti jo olemassa?
   → src/components/ui/ kansio

4. Käytätkö COLORS-vakioita väreille?
   → src/constants/colors.js

5. Käytätkö ROUTES-vakioita reiteille?
   → src/constants/routes.js

6. Onko jokaisella funktiolla JSDoc?

7. Onko jokainen Supabase-kutsu try/catchissa?

8. Onko käyttäjän user_id mukana kaikissa kyselyissä?

9. Onko poistossa vahvistusmodaali?

10. Onko lataus- ja virhetiloille käsittely?

Jos jokin yllä olevista puuttuu — korjaa ennen
kuin jatkat eteenpäin.