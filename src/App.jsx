/**
 * App.jsx
 * Sovelluksen pääreititin.
 *
 * ProtectedRoute  — vaatii kirjautumisen, muuten ohjaa ROUTES.LOGIN
 * PublicRoute     — kirjautunut käyttäjä ohjataan ROUTES.DASHBOARD
 *
 * BrowserRouter on main.jsx:ssä — ei tarvita tässä uudelleen.
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth }          from './hooks/useAuth'
import { ROUTES }           from './constants/routes'
import LoadingSpinner       from './components/ui/LoadingSpinner'

// Sivut
import Home           from './pages/Home'
import Login          from './pages/Login'
import Register       from './pages/Register'
import Dashboard      from './pages/Dashboard'
import Editor         from './pages/Editor'
import SeasonPlanner  from './pages/SeasonPlanner'
import MatchDay       from './pages/MatchDay'
import Teams          from './pages/Teams'

// Auth-sivut joilla ei vielä ole omaa pages/-tiedostoa
import ForgotPasswordPage from './components/auth/ForgotPasswordPage'
import ResetPasswordPage  from './components/auth/ResetPasswordPage'

// ── REITTIVARTIJAT ──

/** Suojattu reitti — ohjaa kirjautumattoman kirjautumissivulle */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  if (!user)   return <Navigate to={ROUTES.LOGIN} replace />
  return children
}

/** Julkinen auth-reitti — ohjaa kirjautuneen dashboardille */
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  if (user)    return <Navigate to={ROUTES.DASHBOARD} replace />
  return children
}

// ── REITITIN ──

export default function App() {
  return (
    <Routes>
      {/* Julkinen etusivu */}
      <Route path={ROUTES.HOME} element={<Home />} />

      {/* Auth-sivut — kirjautunut ohjataan dashboardille */}
      <Route path={ROUTES.LOGIN} element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path={ROUTES.REGISTER} element={
        <PublicRoute><Register /></PublicRoute>
      } />
      <Route path={ROUTES.FORGOT_PASSWORD} element={
        <PublicRoute><ForgotPasswordPage /></PublicRoute>
      } />

      {/* Salasanan vaihto — Supabase ohjaa tänne; ei PublicRoute-vaatimusta */}
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

      {/* Suojatut sivut — vaatii kirjautumisen */}
      <Route path={ROUTES.DASHBOARD} element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path={ROUTES.EDITOR} element={
        <ProtectedRoute><Editor /></ProtectedRoute>
      } />
      <Route path={ROUTES.SEASON} element={
        <ProtectedRoute><SeasonPlanner /></ProtectedRoute>
      } />
      <Route path={ROUTES.MATCH_DAY} element={
        <ProtectedRoute><MatchDay /></ProtectedRoute>
      } />
      <Route path={`${ROUTES.MATCH_DAY}/:id`} element={
        <ProtectedRoute><MatchDay /></ProtectedRoute>
      } />
      <Route path={ROUTES.TEAMS} element={
        <ProtectedRoute><Teams /></ProtectedRoute>
      } />

      {/* Tuntematon polku — ohjaa etusivulle */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}
