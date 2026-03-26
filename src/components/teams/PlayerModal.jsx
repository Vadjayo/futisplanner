/**
 * PlayerModal.jsx
 * Modaali pelaajan lisäämiseen tai muokkaamiseen.
 *
 * @param {boolean}  isOpen          - Näytetäänkö modaali
 * @param {Function} onClose         - () => void
 * @param {Function} onSave          - (playerData) => Promise<void>
 * @param {object|null} player       - null = luontitila, object = muokkaustila
 * @param {number[]} existingNumbers - Olemassa olevat numerot duplikaattitarkistukseen
 */

import { useState, useEffect } from 'react'
import { COLORS } from '../../constants/colors'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const POSITIONS = ['MV', 'PO', 'KP', 'KK', 'HY']

const POSITION_COLORS = {
  MV: COLORS.status.warning,
  PO: COLORS.event.game,
  KP: COLORS.brand.primary,
  KK: COLORS.event.tournament,
  HY: COLORS.status.danger,
}

/** Tyhjä lomakkeen alkutila */
const EMPTY_FORM = {
  name:               '',
  number:             '',
  birth_year:         '',
  position:           '',
  position_secondary: '',
  notes:              '',
}

/** Pikanappi pelipaikan valintaan */
function PosButton({ pos, selected, onSelect }) {
  const color = POSITION_COLORS[pos]
  const isActive = selected === pos
  return (
    <button
      type="button"
      onClick={() => onSelect(pos)}
      style={{
        padding: '4px 10px',
        borderRadius: 5,
        border: `1px solid ${isActive ? color : '#1e2230'}`,
        background: isActive ? `${color}22` : 'transparent',
        color: isActive ? color : COLORS.text.secondary,
        fontWeight: isActive ? 700 : 400,
        fontSize: 11,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.12s',
      }}
    >
      {pos}
    </button>
  )
}

export default function PlayerModal({ isOpen, onClose, onSave, player, existingNumbers }) {
  const isEditMode = player != null
  const [form, setForm]     = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Täytä lomake muokkaustilassa
  useEffect(() => {
    if (isOpen) {
      setErrors({})
      setSaving(false)
      if (isEditMode) {
        setForm({
          name:               player.name               ?? '',
          number:             player.number             ?? '',
          birth_year:         player.birth_year         ?? '',
          position:           player.position           ?? '',
          position_secondary: player.position_secondary ?? '',
          notes:              player.notes              ?? '',
        })
      } else {
        setForm(EMPTY_FORM)
      }
    }
  }, [isOpen, isEditMode, player])

  /** Päivitä kenttä */
  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }))
  }

  /** Validoi lomake ennen tallennusta */
  function validate() {
    const e = {}
    if (!form.name.trim())  e.name = 'Nimi on pakollinen.'
    if (!form.position)     e.position = 'Pelipaikka on pakollinen.'
    const num = form.number !== '' ? Number(form.number) : null
    if (num !== null) {
      if (!Number.isInteger(num) || num < 1 || num > 99) {
        e.number = 'Numeron tulee olla 1–99.'
      } else {
        // Tarkista duplikaatti (muokkauksessa sallitaan oma numero)
        const othersNumbers = isEditMode
          ? existingNumbers.filter((n) => n !== player.number)
          : existingNumbers
        if (othersNumbers.includes(num)) {
          e.number = `Numero ${num} on jo käytössä.`
        }
      }
    }
    return e
  }

  async function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setSaving(true)
    await onSave({
      name:               form.name.trim(),
      number:             form.number !== '' ? Number(form.number) : null,
      birth_year:         form.birth_year !== '' ? Number(form.birth_year) : null,
      position:           form.position   || null,
      position_secondary: form.position_secondary || null,
      notes:              form.notes.trim() || null,
    })
    setSaving(false)
  }

  const label = (text, required = false) => (
    <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.text.secondary, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
      {text}{required && <span style={{ color: COLORS.status.danger }}> *</span>}
    </label>
  )

  const inputStyle = (hasError) => ({
    width: '100%',
    background: '#1a1d27',
    border: `1px solid ${hasError ? COLORS.status.danger : '#1e2230'}`,
    borderRadius: 6,
    padding: '8px 10px',
    color: COLORS.text.light,
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  })

  const errorMsg = (key) => errors[key]
    ? <p style={{ color: COLORS.status.danger, fontSize: 11, margin: '4px 0 0' }}>{errors[key]}</p>
    : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Muokkaa pelaajaa' : 'Lisää pelaaja'}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={saving}>
            Peruuta
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit} loading={saving}>
            {isEditMode ? 'Tallenna muutokset' : 'Lisää pelaaja'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Nimi */}
        <div>
          {label('Nimi', true)}
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Esim. Matti Meikäläinen"
            style={inputStyle(errors.name)}
            autoFocus
          />
          {errorMsg('name')}
        </div>

        {/* Numero + syntymävuosi rinnakkain */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            {label('Numero')}
            <input
              type="number"
              value={form.number}
              onChange={(e) => setField('number', e.target.value)}
              placeholder="1–99"
              min={1} max={99}
              style={inputStyle(errors.number)}
            />
            {errorMsg('number')}
          </div>
          <div>
            {label('Syntymävuosi')}
            <input
              type="number"
              value={form.birth_year}
              onChange={(e) => setField('birth_year', e.target.value)}
              placeholder="Esim. 2010"
              min={1970} max={2020}
              style={inputStyle(false)}
            />
          </div>
        </div>

        {/* Pelipaikka */}
        <div>
          {label('Pelipaikka', true)}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {POSITIONS.map((pos) => (
              <PosButton
                key={pos}
                pos={pos}
                selected={form.position}
                onSelect={(p) => setField('position', p)}
              />
            ))}
          </div>
          {errorMsg('position')}
        </div>

        {/* Varapelipaikka */}
        <div>
          {label('Varapelipaikka')}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setField('position_secondary', '')}
              style={{
                padding: '4px 10px',
                borderRadius: 5,
                border: `1px solid ${!form.position_secondary ? COLORS.text.secondary : '#1e2230'}`,
                background: !form.position_secondary ? `${COLORS.text.secondary}22` : 'transparent',
                color: !form.position_secondary ? COLORS.text.light : COLORS.text.secondary,
                fontWeight: !form.position_secondary ? 700 : 400,
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              —
            </button>
            {POSITIONS.map((pos) => (
              <PosButton
                key={pos}
                pos={pos}
                selected={form.position_secondary}
                onSelect={(p) => setField('position_secondary', p === form.position_secondary ? '' : p)}
              />
            ))}
          </div>
        </div>

        {/* Muistiinpanot */}
        <div>
          {label('Muistiinpanot')}
          <textarea
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder="Vapaamuotoiset muistiinpanot..."
            rows={3}
            style={{
              ...inputStyle(false),
              resize: 'vertical',
              minHeight: 60,
            }}
          />
        </div>
      </div>
    </Modal>
  )
}
