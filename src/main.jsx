/**
 * main.jsx
 * Sovelluksen käynnistyspiste. Mounttaa React-puun DOM:iin.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// BrowserRouter käärii koko sovelluksen jotta React Router toimii
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
