/**
 * TeamHeader.jsx
 * Joukkueen otsikko, perustiedot ja toimintopainikkeet. Puhdas UI-komponentti.
 *
 * @param {object}   team     - Joukkueen tiedot
 * @param {Function} onEdit   - () => void
 * @param {Function} onDelete - () => void
 */

import { COLORS } from '../../constants/colors'
import Button from '../ui/Button'
import styles from './TeamHeader.module.css'

/** Tasotekstin muotoilu */
function levelLabel(level) {
  if (level === 'kilpa') return 'Kilpa'
  if (level === 'harraste') return 'Harraste'
  return level ?? '—'
}

export default function TeamHeader({ team, onEdit, onDelete }) {
  return (
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <h1 className={styles.title} style={{ color: COLORS.text.primary }}>
          {team.name}
        </h1>
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Muokkaa
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Poista joukkue
          </Button>
        </div>
      </div>

      <div className={styles.infoCard} style={{ background: COLORS.bg.surface, border: `1px solid ${COLORS.bg.border}` }}>
        <div className={styles.infoRow}>
          <div className={styles.infoField}>
            <span className={styles.infoLabel} style={{ color: COLORS.text.secondary }}>IKÄLUOKKA</span>
            <span className={styles.infoValue} style={{ color: COLORS.text.light }}>
              {team.age_group || '—'}
            </span>
          </div>
          <div className={styles.infoDivider} style={{ background: COLORS.bg.border }} />
          <div className={styles.infoField}>
            <span className={styles.infoLabel} style={{ color: COLORS.text.secondary }}>KAUSI</span>
            <span className={styles.infoValue} style={{ color: COLORS.text.light }}>
              {team.season || '—'}
            </span>
          </div>
          <div className={styles.infoDivider} style={{ background: COLORS.bg.border }} />
          <div className={styles.infoField}>
            <span className={styles.infoLabel} style={{ color: COLORS.text.secondary }}>TASO</span>
            <span className={styles.infoValue} style={{ color: COLORS.text.light }}>
              {levelLabel(team.level)}
            </span>
          </div>
        </div>

        {team.coaches && (
          <>
            <div className={styles.coachesDivider} style={{ background: COLORS.bg.border }} />
            <div className={styles.coachesRow}>
              <span className={styles.infoLabel} style={{ color: COLORS.text.secondary }}>VALMENTAJAT</span>
              <span className={styles.coachesValue} style={{ color: COLORS.text.light }}>
                {team.coaches}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
