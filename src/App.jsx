// Sovelluksen reititys — määrittelee sivujen URL-rakenne
// Etusivu → Kirjautuminen → Editori

import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './components/landing/LandingPage'
import AuthPage from './components/auth/AuthPage'
import Dashboard from './components/dashboard/Dashboard'
import EditorApp from './EditorApp'

export default function App() {
  return (
    <Routes>
      {/* Etusivu — julkinen landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Kirjautuminen ja rekisteröinti */}
      <Route path="/kirjaudu" element={<AuthPage />} />

      {/* Dashboard — kirjautuneen käyttäjän aloitussivu */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Editori — suojattu, vaatii kirjautumisen */}
      <Route path="/sovellus" element={<EditorApp />} />

      {/* Tuntematon polku — ohjaa etusivulle */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
