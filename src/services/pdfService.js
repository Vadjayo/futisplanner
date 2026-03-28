/**
 * pdfService.js
 * PDF-vienti harjoitussuunnitelmille jsPDF:llä.
 * Rakenne: otsikkopalkki → yhteenveto → harjoitteet 2 per rivi.
 *
 * Käyttö:
 *   import { exportSessionPdf } from '@/services/pdfService'
 *   await exportSessionPdf(drillCardRefs, drills, sessionName, sessionMeta)
 */

import jsPDF from 'jspdf'

// ── LAYOUT-VAKIOT ──

const FIELD_ASPECT = 1000 / 650   // kentän kuvasuhde

const PAGE_W   = 210              // A4 leveys mm
const PAGE_H   = 297              // A4 korkeus mm
const MARGIN   = 12
const GAP      = 5

const CONTENT_W = PAGE_W - 2 * MARGIN
const COL_W     = (CONTENT_W - GAP) / 2
const DRILL_H   = COL_W / FIELD_ASPECT

// ── VÄRIT (RGB-taulukoina jsPDF-kutsuihin) ──

const C_BG      = [248, 249, 251]
const C_HEADER  = [20,  30,  45]
const C_TEXT    = [20,  30,  45]
const C_MUTED   = [100, 115, 130]
const C_BORDER  = [220, 226, 234]
const C_DRILLBG = [240, 243, 247]
const C_ACCENT  = [29,  158, 117]

// ── APUFUNKTIOT ──

/**
 * Lisää uusi sivu PDF:ään ja täytä se taustavärillä.
 * @param {jsPDF} pdf
 * @returns {number} Y-koordinaatti (ylämarginaali)
 */
function addPage(pdf) {
  pdf.addPage()
  pdf.setFillColor(...C_BG)
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')
  return MARGIN
}

// ── PÄÄFUNKTIO ──

/**
 * Generoi ja lataa PDF-harjoitussuunnitelman.
 *
 * @param {Array<{ getImageDataUrl: () => string|null }>} drillCardRefs
 *   Viitteet DrillCard-komponentteihin kenttäkuvaa varten
 * @param {Array<{ title: string, duration: number }>} drills
 * @param {string} sessionName
 * @param {object} [sessionMeta={}]
 *   Valinnainen: theme, description, focusTechnical, focusTactical,
 *                focusPhysical, focusMental
 * @returns {Promise<{ error: Error|null }>}
 */
export async function exportSessionPdf(drillCardRefs, drills, sessionName, sessionMeta = {}) {
  try {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Taustaväri ensimmäiselle sivulle
  pdf.setFillColor(...C_BG)
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')

  const totalMin = drills.reduce((sum, d) => sum + (d.duration || 0), 0)
  let y = MARGIN

  // ── OTSIKKOPALKKI ──
  const headerH = 16
  pdf.setFillColor(...C_HEADER)
  pdf.roundedRect(MARGIN, y, CONTENT_W, headerH, 3, 3, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(13)
  pdf.setFont('helvetica', 'bold')
  pdf.text(sessionName || 'Harjoitussuunnitelma', MARGIN + 5, y + 10.5)

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(160, 185, 210)
  pdf.text(
    `${drills.length} harjoitetta  ·  ${totalMin} min`,
    MARGIN + CONTENT_W - 4, y + 10.5,
    { align: 'right' }
  )
  y += headerH + 6

  // ── YHTEENVETO ──
  const topFields = [
    { key: 'theme',       label: 'Teema' },
    { key: 'description', label: 'Kuvaus' },
  ].filter(f => sessionMeta[f.key]?.trim())

  const focusFields = [
    { key: 'focusTechnical', label: 'Tekninen' },
    { key: 'focusTactical',  label: 'Taktinen' },
    { key: 'focusPhysical',  label: 'Fyysinen' },
    { key: 'focusMental',    label: 'Henkinen' },
  ].filter(f => sessionMeta[f.key]?.trim())

  if (topFields.length > 0 || focusFields.length > 0) {
    // Teema ja kuvaus — täysleveys
    for (const { label, key } of topFields) {
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...C_ACCENT)
      pdf.text(label.toUpperCase(), MARGIN, y)
      y += 4

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...C_TEXT)
      const lines = pdf.splitTextToSize(sessionMeta[key].trim(), CONTENT_W)
      pdf.text(lines, MARGIN, y)
      y += lines.length * 4.5 + 5
    }

    // Fokusalueet — 2 per rivi
    if (focusFields.length > 0) {
      const focusColW = (CONTENT_W - GAP) / 2
      for (let fi = 0; fi < focusFields.length; fi += 2) {
        const rowY = y
        let rowH = 0
        for (let ci = 0; ci < 2 && fi + ci < focusFields.length; ci++) {
          const { label, key } = focusFields[fi + ci]
          const cx = MARGIN + ci * (focusColW + GAP)

          pdf.setFontSize(7)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...C_ACCENT)
          pdf.text(label.toUpperCase(), cx, rowY)

          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(...C_TEXT)
          const lines = pdf.splitTextToSize(sessionMeta[key].trim(), focusColW)
          pdf.text(lines, cx, rowY + 4)

          const h = 4 + lines.length * 4.5
          if (h > rowH) rowH = h
        }
        y += rowH + 5
      }
    }

    // Erotinviiva
    pdf.setDrawColor(...C_BORDER)
    pdf.setLineWidth(0.3)
    pdf.line(MARGIN, y, MARGIN + CONTENT_W, y)
    y += 5
  }

  // ── HARJOITTEET 2 PER RIVI ──
  const ROW_H = DRILL_H + 10

  for (let i = 0; i < drills.length; i += 2) {
    if (y + ROW_H > PAGE_H - MARGIN) {
      y = addPage(pdf)
    }

    for (let col = 0; col < 2; col++) {
      const idx     = i + col
      if (idx >= drills.length) break

      const drill   = drills[idx]
      const cardRef = drillCardRefs[idx]
      const cx      = MARGIN + col * (COL_W + GAP)

      // Harjoitteen taustalaatikko
      pdf.setFillColor(...C_DRILLBG)
      pdf.roundedRect(cx, y, COL_W, ROW_H, 2, 2, 'F')

      // Otsikko
      pdf.setFontSize(7.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...C_TEXT)
      pdf.text(`${idx + 1}. ${drill.title || 'Nimetön harjoite'}`, cx + 2.5, y + 5.5)

      // Kesto
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...C_MUTED)
      pdf.text(`${drill.duration} min`, cx + COL_W - 2.5, y + 5.5, { align: 'right' })

      // Kenttäkuva
      if (cardRef?.getImageDataUrl) {
        const imgData = cardRef.getImageDataUrl()
        if (imgData) pdf.addImage(imgData, 'PNG', cx, y + 8, COL_W, DRILL_H)
      }
    }

    y += ROW_H + GAP
  }

  // Sanitoi tiedostonimi
  const filename = (sessionName || 'harjoitus')
    .replace(/[^a-zA-Z0-9äöåÄÖÅ _-]/g, '')
    .trim() || 'harjoitus'

    pdf.save(`${filename}.pdf`)
    return { error: null }
  } catch (error) {
    console.error('PDF-vienti epäonnistui:', error)
    return { error }
  }
}
