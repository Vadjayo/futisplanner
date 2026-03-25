/**
 * LibraryPanel.jsx
 * Harjoitekirjaston sivupaneeli. Selaus, suodatus ja lisäys omaan sessioon.
 */

import { useState, useEffect } from 'react'
import { loadLibrary, loadUserLibrary, deleteFromLibrary } from '../../lib/db'
import styles from './LibraryPanel.module.css'

// Harjoitekategoriat — vastaavat tietokannan category-kentän arvoja
const CATEGORIES = [
  { id: 'kaikki',    label: 'Kaikki' },
  { id: 'lammittely', label: 'Lämmittely' },
  { id: 'tekniikka', label: 'Tekniikka' },
  { id: 'taktiikka', label: 'Taktiikka' },
  { id: 'fysiikka',  label: 'Fysiikka' },
  { id: 'maalivahti', label: 'Maalivahti' },
]

// Ikäluokat — tietokannassa age_group-kenttä
const AGE_GROUPS = [
  { id: 'kaikki', label: 'Kaikki' },
  { id: 'U6-U8',  label: 'U6–U8' },
  { id: 'U9-U11', label: 'U9–U11' },
  { id: 'U12-U14', label: 'U12–U14' },
  { id: 'U15-U18', label: 'U15–U18' },
]

// Värit kategoriakorteille UI:ssa
const CATEGORY_COLORS = {
  lammittely: '#f97316',
  tekniikka:  '#3b82f6',
  taktiikka:  '#8b5cf6',
  fysiikka:   '#ef4444',
  maalivahti: '#10b981',
}

export default function LibraryPanel({ userId, onClose, onAddDrill }) {
  const [drills, setDrills] = useState([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('julkiset') // 'julkiset' | 'omat'
  const [category, setCategory] = useState('kaikki')
  const [ageGroup, setAgeGroup] = useState('kaikki')
  const [search, setSearch] = useState('')

  function reload() {
    setLoading(true)
    const fetcher = source === 'omat'
      ? loadUserLibrary(userId)
      : loadLibrary({ category, ageGroup, search })
    fetcher.then(({ data }) => {
      setDrills(data ?? [])
      setLoading(false)
    })
  }

  useEffect(() => { reload() }, [source, category, ageGroup, search]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id) {
    await deleteFromLibrary(id)
    setDrills((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    // Klikkaamalla taustaa paneeli sulkeutuu
    <div className={styles.overlay} onClick={onClose}>
      {/* stopPropagation estää paneelin sulkeutumisen sitä klikatessa */}
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>

        {/* Otsikkorivi */}
        <div className={styles.header}>
          <h2 className={styles.title}>Harjoituskirjasto</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Lähdevalinta: julkinen kirjasto / omat tallennetut */}
        <div className={styles.filterRow}>
          <button
            className={`${styles.filterBtn} ${source === 'julkiset' ? styles.filterActive : ''}`}
            onClick={() => setSource('julkiset')}
          >Kirjasto</button>
          <button
            className={`${styles.filterBtn} ${source === 'omat' ? styles.filterActive : ''}`}
            onClick={() => setSource('omat')}
          >Omat</button>
        </div>

        {/* Hakukenttä — hakee harjoitteen nimestä */}
        <div className={styles.searchRow}>
          <input
            className={styles.search}
            type="search"
            placeholder="Hae harjoitteita..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Ikäluokka- ja kategoriasuodattimet vain julkisessa kirjastossa */}
        {source === 'julkiset' && <div className={styles.filterRow}>
          {AGE_GROUPS.map((ag) => (
            <button
              key={ag.id}
              className={`${styles.filterBtn} ${ageGroup === ag.id ? styles.filterActive : ''}`}
              onClick={() => setAgeGroup(ag.id)}
            >
              {ag.label}
            </button>
          ))}
        </div>}

        {/* Kategoriasuodatin — aktiivinen korostetaan kategorian omalla värillä */}
        {source === 'julkiset' && <div className={styles.filterRow}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.catBtn} ${category === cat.id ? styles.catActive : ''}`}
              style={category === cat.id && cat.id !== 'kaikki'
                ? { background: CATEGORY_COLORS[cat.id], borderColor: CATEGORY_COLORS[cat.id] }
                : {}
              }
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>}

        {/* Hakutulokset */}
        <div className={styles.results}>
          {loading && <p className={styles.status}>Ladataan...</p>}
          {!loading && drills.length === 0 && (
            <p className={styles.status}>Ei harjoitteita valituilla suodattimilla.</p>
          )}
          {!loading && drills.map((drill) => (
            <div key={drill.id} className={styles.drillCard}>
              <div className={styles.drillMeta}>
                {/* Kategoriamerkki kategorian värillä */}
                <span
                  className={styles.catBadge}
                  style={{ background: CATEGORY_COLORS[drill.category] ?? '#3d5068' }}
                >
                  {CATEGORIES.find((c) => c.id === drill.category)?.label ?? drill.category}
                </span>
                <span className={styles.ageBadge}>{drill.age_group}</span>
                <span className={styles.duration}>{drill.duration} min</span>
                <span className={styles.fieldType}>{drill.field_type}</span>
              </div>
              <h3 className={styles.drillTitle}>{drill.title}</h3>
              {drill.description && (
                <p className={styles.drillDesc}>{drill.description}</p>
              )}
              <div className={styles.cardActions}>
              {/* Lisää harjoite harjoitukseen ja sulje paneeli */}
              <button
                className={styles.addBtn}
                onClick={() => {
                  onAddDrill(drill)
                  onClose()
                }}
              >
                + Lisää harjoitukseen
              </button>
              {/* Poista oma harjoite kirjastosta */}
              {source === 'omat' && (
                <button className={styles.deleteBtn} onClick={() => handleDelete(drill.id)}>
                  Poista
                </button>
              )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
