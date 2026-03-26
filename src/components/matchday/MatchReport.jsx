/**
 * MatchReport.jsx
 * Otteluraportti: lopputulos, maalit, vaihdot, pelaajaarviot, valmentajan arvio.
 * Täytetään ottelun JÄLKEEN.
 */

import { COLORS } from '../../constants/colors'
import styles     from './MatchReport.module.css'

const GOAL_TYPES = [
  { value: 'goal',      label: 'Maali' },
  { value: 'own_goal',  label: 'Omamaali' },
  { value: 'penalty',   label: 'Rangaistuspotku' },
]

/**
 * Tähtiarvio 1–5.
 * @param {number}   value
 * @param {function} onChange
 */
function StarRating({ value, onChange }) {
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          className={styles.star}
          style={{ color: n <= (value || 0) ? COLORS.status.warning : '#2a2d35' }}
          onClick={() => onChange(n)}
          title={`${n} tähteä`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

/**
 * @param {object}   plan      - Koko pelipäiväsuunnitelma
 * @param {function} onChange  - (field, value) => void
 */
export default function MatchReport({ plan, onChange }) {
  const lineup = plan.lineup ?? []

  // ── Maalien hallinta ──

  function addGoal() {
    onChange('goals', [
      ...plan.goals,
      { id: crypto.randomUUID(), playerId: '', name: '', minute: '', type: 'goal' },
    ])
  }

  function updateGoal(goalId, field, value) {
    onChange('goals', plan.goals.map((g) =>
      g.id === goalId ? { ...g, [field]: value } : g
    ))
  }

  function removeGoal(goalId) {
    onChange('goals', plan.goals.filter((g) => g.id !== goalId))
  }

  // ── Vaihtojen hallinta ──

  function addSubstitution() {
    onChange('substitutions', [
      ...plan.substitutions,
      { id: crypto.randomUUID(), outName: '', inName: '', minute: '' },
    ])
  }

  function updateSubstitution(subId, field, value) {
    onChange('substitutions', plan.substitutions.map((s) =>
      s.id === subId ? { ...s, [field]: value } : s
    ))
  }

  function removeSubstitution(subId) {
    onChange('substitutions', plan.substitutions.filter((s) => s.id !== subId))
  }

  // ── Pelaajaarviot ──

  function getRating(playerId) {
    return plan.playerRatings?.find((r) => r.playerId === playerId)?.rating ?? 0
  }

  function setRating(playerId, name, rating) {
    const updated = (plan.playerRatings ?? []).filter((r) => r.playerId !== playerId)
    onChange('playerRatings', [...updated, { playerId, name, rating }])
  }

  return (
    <div className={styles.report}>

      {/* Lopputulos */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Lopputulos</h4>
        <div className={styles.resultRow}>
          <div className={styles.resultTeam}>
            <input
              className={styles.resultInput}
              type="number"
              min="0"
              max="99"
              value={plan.resultHome ?? ''}
              onChange={(e) => onChange('resultHome', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="–"
            />
            <span className={styles.resultTeamName}>Oma</span>
          </div>
          <span className={styles.resultDash}>–</span>
          <div className={styles.resultTeam}>
            <input
              className={styles.resultInput}
              type="number"
              min="0"
              max="99"
              value={plan.resultAway ?? ''}
              onChange={(e) => onChange('resultAway', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="–"
            />
            <span className={styles.resultTeamName}>{plan.opponent || 'Vieras'}</span>
          </div>
        </div>
      </div>

      {/* Maalit */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Maalit</h4>
        {plan.goals.map((goal) => (
          <div key={goal.id} className={styles.listRow}>
            <input
              className={styles.smallInput}
              type="text"
              value={goal.name}
              onChange={(e) => updateGoal(goal.id, 'name', e.target.value)}
              placeholder="Pelaaja"
            />
            <input
              className={`${styles.smallInput} ${styles.minuteInput}`}
              type="number"
              min="1"
              max="120"
              value={goal.minute}
              onChange={(e) => updateGoal(goal.id, 'minute', e.target.value)}
              placeholder="Min"
            />
            <select
              className={styles.smallSelect}
              value={goal.type}
              onChange={(e) => updateGoal(goal.id, 'type', e.target.value)}
            >
              {GOAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <button className={styles.removeBtn} onClick={() => removeGoal(goal.id)} title="Poista">✕</button>
          </div>
        ))}
        <button className={styles.addBtn} onClick={addGoal}>+ Lisää maali</button>
      </div>

      {/* Vaihdot */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Vaihdot</h4>
        {plan.substitutions.map((sub) => (
          <div key={sub.id} className={styles.listRow}>
            <input
              className={styles.smallInput}
              type="text"
              value={sub.outName}
              onChange={(e) => updateSubstitution(sub.id, 'outName', e.target.value)}
              placeholder="Ulos"
            />
            <span className={styles.arrowLabel}>→</span>
            <input
              className={styles.smallInput}
              type="text"
              value={sub.inName}
              onChange={(e) => updateSubstitution(sub.id, 'inName', e.target.value)}
              placeholder="Sisään"
            />
            <input
              className={`${styles.smallInput} ${styles.minuteInput}`}
              type="number"
              min="1"
              max="120"
              value={sub.minute}
              onChange={(e) => updateSubstitution(sub.id, 'minute', e.target.value)}
              placeholder="Min"
            />
            <button className={styles.removeBtn} onClick={() => removeSubstitution(sub.id)} title="Poista">✕</button>
          </div>
        ))}
        <button className={styles.addBtn} onClick={addSubstitution}>+ Lisää vaihto</button>
      </div>

      {/* Pelaajaarviot */}
      {lineup.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Pelaajaarviot</h4>
          {lineup.map((p) => (
            <div key={p.id} className={styles.ratingRow}>
              <span className={styles.ratingName}>{p.name || p.position}</span>
              <StarRating
                value={getRating(p.id)}
                onChange={(rating) => setRating(p.id, p.name, rating)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Valmentajan arvio */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Valmentajan arvio</h4>
        <textarea
          className={styles.textarea}
          value={plan.postMatchNotes}
          onChange={(e) => onChange('postMatchNotes', e.target.value)}
          placeholder="Yleinen arvio ottelusta, mikä meni hyvin, mitä pitää kehittää..."
          rows={5}
        />
      </div>

    </div>
  )
}
