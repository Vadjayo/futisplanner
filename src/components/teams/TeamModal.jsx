/**
 * TeamModal.jsx
 * Modaali joukkueen luomiseen tai muokkaamiseen.
 *
 * @param {boolean}     isOpen  - Näytetäänkö modaali
 * @param {Function}    onClose - () => void
 * @param {Function}    onSave  - (formData) => Promise<void>
 * @param {object|null} team    - null = luontitila, object = muokkaustila
 */

import { useState, useEffect } from 'react'
import { COLORS } from '../../constants/colors'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const EMPTY_FORM = {
  name:     '',
  ageGroup: '',
  season:   '',
  level:    'harraste',
  coaches:  '',
}

export default function TeamModal({ isOpen, onClose, onSave, team }) {
  const isEditMode = team != null
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
          name:     team.name      ?? '',
          ageGroup: team.age_group ?? '',
          season:   team.season    ?? '',
          level:    team.level     ?? 'harraste',
          coaches:  team.coaches   ?? '',
        })
      } else {
        setForm(EMPTY_FORM)
      }
    }
  }, [isOpen, isEditMode, team])

  /** Päivitä kenttä */
  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }))
  }

  /** Validoi lomake */
  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Joukkueen nimi on pakollinen.'
    return e
  }

  async function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setSaving(true)
    await onSave({
      name:     form.name.trim(),
      ageGroup: form.ageGroup.trim() || null,
      season:   form.season.trim()   || null,
      level:    form.level,
      coaches:  form.coaches.trim()  || null,
    })
    setSaving(false)
  }

  const label = (text, required = false) => (
    <label style={{
      fontSize: 11, fontWeight: 600, color: COLORS.text.secondary,
      letterSpacing: '0.05em', textTransform: 'uppercase',
      display: 'block', marginBottom: 5,
    }}>
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

  /** Taso-toggle: harraste / kilpa */
  function LevelToggle() {
    const opts = [
      { value: 'harraste', label: 'Harraste' },
      { value: 'kilpa',    label: 'Kilpa' },
    ]
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        {opts.map(({ value, label: lbl }) => {
          const isActive = form.level === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setField('level', value)}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 6,
                border: `1px solid ${isActive ? COLORS.brand.primary : '#1e2230'}`,
                background: isActive ? COLORS.brand.primaryLight : 'transparent',
                color: isActive ? COLORS.brand.primary : COLORS.text.secondary,
                fontWeight: isActive ? 700 : 400,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.12s',
              }}
            >
              {lbl}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Muokkaa joukkuetta' : 'Luo uusi joukkue'}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={saving}>
            Peruuta
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit} loading={saving}>
            {isEditMode ? 'Tallenna muutokset' : 'Luo joukkue'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Nimi */}
        <div>
          {label('Joukkueen nimi', true)}
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Esim. FC Hesa U15"
            style={inputStyle(errors.name)}
            autoFocus
          />
          {errorMsg('name')}
        </div>

        {/* Ikäluokka + kausi rinnakkain */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            {label('Ikäluokka')}
            <input
              type="text"
              value={form.ageGroup}
              onChange={(e) => setField('ageGroup', e.target.value)}
              placeholder="Esim. U15"
              style={inputStyle(false)}
            />
          </div>
          <div>
            {label('Kausi')}
            <input
              type="text"
              value={form.season}
              onChange={(e) => setField('season', e.target.value)}
              placeholder="Esim. 2025"
              style={inputStyle(false)}
            />
          </div>
        </div>

        {/* Taso */}
        <div>
          {label('Taso')}
          <LevelToggle />
        </div>

        {/* Valmentajat */}
        <div>
          {label('Valmentajat')}
          <input
            type="text"
            value={form.coaches}
            onChange={(e) => setField('coaches', e.target.value)}
            placeholder="Esim. Matti Virtanen, Liisa Korhonen"
            style={inputStyle(false)}
          />
        </div>
      </div>
    </Modal>
  )
}
