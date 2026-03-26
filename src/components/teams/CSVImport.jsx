/**
 * CSVImport.jsx
 * Modaali pelaajien tuomiseen CSV-tiedostosta.
 *
 * CSV-muoto: Nimi,Numero,Pelipaikka,Syntymävuosi (otsikkorivi)
 *
 * @param {boolean}  isOpen    - Näytetäänkö modaali
 * @param {Function} onClose   - () => void
 * @param {Function} onImport  - (players: Array) => Promise<void>
 */

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { COLORS } from '../../constants/colors'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

/** Muuntaa CSV-rivin pelaajaobjektiksi */
function rowToPlayer(row) {
  return {
    name:       (row['Nimi'] ?? row['nimi'] ?? '').trim(),
    number:     row['Numero'] != null && row['Numero'] !== '' ? Number(row['Numero']) : null,
    position:   (row['Pelipaikka'] ?? row['pelipaikka'] ?? '').trim().toUpperCase() || null,
    birth_year: row['Syntymävuosi'] != null && row['Syntymävuosi'] !== '' ? Number(row['Syntymävuosi']) : null,
  }
}

export default function CSVImport({ isOpen, onClose, onImport }) {
  const [parsed,    setParsed]    = useState(null)   // Array | null
  const [fileName,  setFileName]  = useState('')
  const [importing, setImporting] = useState(false)
  const fileRef = useRef(null)

  /** Resetoi tila suljettaessa */
  function handleClose() {
    setParsed(null)
    setFileName('')
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
    onClose()
  }

  /** Parsii valitun CSV-tiedoston */
  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const players = results.data
          .map(rowToPlayer)
          .filter((p) => p.name.length > 0)  // poistetaan tyhjät nimet
        setParsed(players)
      },
    })
  }

  async function handleImport() {
    if (!parsed || parsed.length === 0) return
    setImporting(true)
    await onImport(parsed)
    setImporting(false)
    handleClose()
  }

  const previewPlayers = parsed?.slice(0, 5) ?? []
  const totalCount = parsed?.length ?? 0

  const thStyle = {
    padding: '6px 10px',
    textAlign: 'left',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    background: '#1a1d27',
    borderBottom: `1px solid ${COLORS.bg.border}`,
  }
  const tdStyle = {
    padding: '7px 10px',
    fontSize: 12,
    color: COLORS.text.light,
    borderBottom: `1px solid ${COLORS.bg.border}`,
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tuo pelaajia CSV:stä"
      size="md"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={handleClose} disabled={importing}>
            Peruuta
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleImport}
            loading={importing}
            disabled={!parsed || totalCount === 0}
          >
            {parsed
              ? `Tuo ${totalCount} pelaajaa`
              : 'Tuo pelaajat'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Ohjeet */}
        <div style={{
          background: COLORS.bg.surface,
          border: `1px solid ${COLORS.bg.border}`,
          borderRadius: 7,
          padding: '10px 14px',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: COLORS.text.light }}>
            Tiedoston muoto:
          </p>
          <code style={{ fontSize: 11, color: COLORS.brand.primary }}>
            Nimi,Numero,Pelipaikka,Syntymävuosi
          </code>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: COLORS.text.secondary }}>
            Ensimmäinen rivi on otsikkorivi. Pelipaikka: MV / PO / KP / KK / HY.
            Numero ja syntymävuosi ovat valinnaisia.
          </p>
        </div>

        {/* Tiedoston valinta */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 11, fontWeight: 600,
            color: COLORS.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6,
          }}>
            CSV-tiedosto
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{
              width: '100%',
              background: '#1a1d27',
              border: `1px solid ${COLORS.bg.border}`,
              borderRadius: 6,
              padding: '7px 10px',
              color: COLORS.text.light,
              fontSize: 12,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
          />
          {fileName && (
            <p style={{ margin: '5px 0 0', fontSize: 11, color: COLORS.text.secondary }}>
              Valittu: {fileName}
            </p>
          )}
        </div>

        {/* Esikatselu */}
        {parsed !== null && (
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: COLORS.text.secondary }}>
              {totalCount === 0
                ? 'Tiedostossa ei löytynyt pelaajia.'
                : `Tuodaan ${totalCount} pelaajaa${totalCount > 5 ? ` (näytetään ${previewPlayers.length} ensimmäistä)` : ''}`}
            </p>
            {previewPlayers.length > 0 && (
              <div style={{ border: `1px solid ${COLORS.bg.border}`, borderRadius: 7, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Nimi</th>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Paikka</th>
                      <th style={thStyle}>Synt.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewPlayers.map((p, i) => (
                      <tr key={i}>
                        <td style={tdStyle}>{p.name}</td>
                        <td style={tdStyle}>{p.number ?? '—'}</td>
                        <td style={tdStyle}>{p.position ?? '—'}</td>
                        <td style={tdStyle}>{p.birth_year ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
