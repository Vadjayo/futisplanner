/**
 * Settings.jsx
 * Käyttäjäasetukset. Toteutetaan Vaiheessa 2.
 *
 * Suunniteltu sisältö:
 *  - Profiilin muokkaus
 *  - Kielivalinta
 *  - Teema
 *  - Salasanan vaihto
 *  - Tilin poisto
 */

import { COLORS } from '../constants/colors'

export default function Settings() {
  return (
    <div style={{ padding: 32, color: COLORS.text.light }}>
      <h1>Asetukset</h1>
      <p style={{ color: COLORS.text.secondary }}>Tämä sivu toteutetaan Vaiheessa 2.</p>
    </div>
  )
}
