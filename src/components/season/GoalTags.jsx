/**
 * GoalTags.jsx
 * Kauden tavoitetägit. Lisäys, poisto ja näyttö.
 */

import styles from './GoalTags.module.css'

// Per-kategoria värit valitulle tagille
const ACTIVE_STYLE = {
  pelilliset:   { background: 'rgba(15,110,86,0.12)',  color: '#1D9E75', border: '0.5px solid rgba(29,158,117,0.25)' },
  fyysiset:     { background: 'rgba(24,95,165,0.12)',  color: '#378ADD', border: '0.5px solid rgba(55,138,221,0.25)' },
  taktiset:     { background: 'rgba(83,74,183,0.12)',  color: '#7F77DD', border: '0.5px solid rgba(127,119,221,0.25)' },
  yksilolliset: { background: 'rgba(133,79,11,0.12)',  color: '#EF9F27', border: '0.5px solid rgba(239,159,39,0.25)' },
}

const CATEGORIES = [
  {
    id: 'pelilliset',
    label: 'Pelilliset tavoitteet',
    icon: '⚽',
    tags: ['Pallonhallinta', 'Prässi', 'Puolustuslinja', 'Rakentelu', 'Syöttöpeli',
           'Laukaiseminen', 'Riistot', 'Kontraus', 'Kulmapotku', 'Heitot', 'Suoraviivainen peli'],
  },
  {
    id: 'fyysiset',
    label: 'Fyysiset tavoitteet',
    icon: '💪',
    tags: ['Nopeus', 'Kestävyys', 'Koordinaatio', 'Voima', 'Ketteryys',
           'Liikkuvuus', 'Aerobinen kunto', 'Anaerobinen kunto', 'Tasapaino', 'Reaktionopeus'],
  },
  {
    id: 'taktiset',
    label: 'Taktiset tavoitteet',
    icon: '🎯',
    tags: ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', 'Prässipelaaminen', 'Ylivoimat',
           'Alivoimat', 'Korkea puolustus', 'Matala puolustus', 'Positiopeli', 'Nopeat vastahyökkäykset'],
  },
  {
    id: 'yksilolliset',
    label: 'Yksilötavoitteet',
    icon: '🏃',
    tags: ['Syöttötarkkuus', 'Viimeistely', '1v1 hyökkäys', '1v1 puolustus',
           'Ilmapeli', 'Vastaanotto', 'Kääntymiset', 'Maalinteko', 'Maalivahtipelaaminen', 'Nopeuserottelut'],
  },
]

export default function GoalTags({ goals, onUpdate }) {
  // goals = { pelilliset: ['Prässi', ...], fyysiset: [...], ... }
  function toggle(categoryId, tag) {
    const current = goals[categoryId] ?? []
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag]
    onUpdate({ ...goals, [categoryId]: next })
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Kausitavoitteet</h2>
      <div className={styles.grid}>
        {CATEGORIES.map((cat) => {
          const selected = goals[cat.id] ?? []
          return (
            <div key={cat.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>{cat.icon}</span>
                <span className={styles.cardLabel}>{cat.label}</span>
                {selected.length > 0 && (
                  <span className={styles.selectedCount}>{selected.length}</span>
                )}
              </div>
              <div className={styles.tags}>
                {cat.tags.map((tag) => (
                  <button
                    key={tag}
                    className={styles.tag}
                    style={selected.includes(tag) ? ACTIVE_STYLE[cat.id] : {}}
                    onClick={() => toggle(cat.id, tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
