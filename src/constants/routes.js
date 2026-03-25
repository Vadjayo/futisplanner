/**
 * routes.js
 * Sovelluksen reittipolut vakioina.
 * Muuta reitti vain täällä — ei hajallaan koodissa.
 *
 * Käyttö: import { ROUTES } from '@/constants'
 *   <Route path={ROUTES.DASHBOARD} element={...} />
 *   navigate(ROUTES.LOGIN)
 */

export const ROUTES = {
  HOME:           '/',
  LOGIN:          '/login',
  REGISTER:       '/register',
  FORGOT_PASSWORD:'/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD:      '/dashboard',
  EDITOR:         '/editor',
  EDITOR_SESSION: '/editor/:id',
  SEASON:         '/kausisuunnittelu',
  TEAMS:          '/joukkueet',
  SETTINGS:       '/asetukset',
  MATCH_DAY:      '/pelipäivä',
}
