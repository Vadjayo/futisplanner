/**
 * main.jsx
 * Sovelluksen käynnistyspiste. Mounttaa React-puun DOM:iin.
 * Alustaa i18next-käännöskirjaston ennen kuin React renderöidään.
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fi from './locales/fi/translation.json'
import en from './locales/en/translation.json'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Alusta i18next — suomi oletuskielenä, englanti fallback-kielenä
i18n.use(initReactI18next).init({
  resources: {
    fi: { translation: fi },
    en: { translation: en },
  },
  lng: 'fi',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

// BrowserRouter käärii koko sovelluksen jotta React Router toimii
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
