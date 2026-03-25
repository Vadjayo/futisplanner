/**
 * App.jsx
 * Sovelluksen pääreititin. Määrittelee kaikki reitit ja autentikoinnin.
 *
 * ProtectedRoute  — vaatii kirjautumisen, muuten ohjaa /kirjaudu
 * PublicRoute     — kirjautunut käyttäjä ohjataan /dashboard (auth-sivut)
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LandingPage          from './components/landing/LandingPage'
import AuthPage             from './components/auth/AuthPage'
import RegisterPage         from './components/auth/RegisterPage'
import ForgotPasswordPage   from './components/auth/ForgotPasswordPage'
import ResetPasswordPage    from './components/auth/ResetPasswordPage'
import Dashboard            from './components/dashboard/Dashboard'
import EditorApp            from './EditorApp'
import SeasonPage           from './components/season/SeasonPage'

// Suojattu reitti — kirjautumaton käyttäjä ohjataan kirjautumissivulle
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null          // odotetaan istunnon tarkistusta
  if (!user)   return <Navigate to="/kirjaudu" replace />
  return children
}

// Julkinen auth-reitti — kirjautunut käyttäjä ohjataan dashboardille
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user)    return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Etusivu — julkinen landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Kirjautuminen — kirjautunut käyttäjä ohjataan pois */}
      <Route path="/kirjaudu" element={
        <PublicRoute><AuthPage /></PublicRoute>
      } />

      {/* Rekisteröinti */}
      <Route path="/rekisteroidy" element={
        <PublicRoute><RegisterPage /></PublicRoute>
      } />

      {/* Salasanan palautus */}
      <Route path="/unohdin-salasanan" element={
        <PublicRoute><ForgotPasswordPage /></PublicRoute>
      } />

      {/* Salasanan vaihto (Supabase ohjaa tänne palautuslinkin kautta) */}
      <Route path="/vaihda-salasana" element={<ResetPasswordPage />} />

      {/* Dashboard — kirjautuneen käyttäjän aloitussivu */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      {/* Editori — suojattu, vaatii kirjautumisen */}
      <Route path="/sovellus" element={
        <ProtectedRoute><EditorApp /></ProtectedRoute>
      } />

      {/* Kausisuunnittelu — suojattu */}
      <Route path="/kausi" element={
        <ProtectedRoute><SeasonPage /></ProtectedRoute>
      } />

      {/* Tuntematon polku — ohjaa etusivulle */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
