/**
 * MatchDayPage.jsx
 * Pelipäiväsuunnittelun pääkomponentti.
 * Kaksi palstaa: vasen (kenttä + tiedot), oikea (välilehdet).
 */

import { useState, useEffect }   from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMatchPlan, FORMATIONS } from '../../hooks/useMatchPlan'
import { useFormationTemplates }    from '../../hooks/useFormationTemplates'
import { useCurrentTeam }           from '../../store/teamStore'
import { useMatchDayPlayers }       from '../../hooks/useMatchDayPlayers'
import { useToast }                 from '../../hooks/useToast'
import { ROUTES }                   from '../../constants/routes'
import { COLORS }                   from '../../constants/colors'
import Button              from '../ui/Button'
import Modal               from '../ui/Modal'
import Toast               from '../ui/Toast'
import MatchHeader         from './MatchHeader'
import FormationSelector   from './FormationSelector'
import FormationTemplates  from './FormationTemplates'
import MatchFieldCanvas    from './MatchFieldCanvas'
import PlayerLists         from './PlayerLists'
import TacticsPanel        from './TacticsPanel'
import NotesPanel          from './NotesPanel'
import MatchReport         from './MatchReport'
import styles              from './MatchDay.module.css'

const TABS = [
  { id: 'players',  label: 'Pelaajat' },
  { id: 'tactics',  label: 'Taktiikat' },
  { id: 'notes',    label: 'Muistiinpanot' },
  { id: 'report',   label: 'Otteluraportti' },
]

export default function MatchDayPage() {
  const navigate              = useNavigate()
  const { id: matchId }       = useParams()
  const { currentTeam: team } = useCurrentTeam()
  const { toasts, showToast } = useToast()

  const {
    plan, loading, dirty,
    updateField, updateLineup, applyFormation, savePlan,
  } = useMatchPlan(matchId ?? null)

  const { templates, saveTemplate } = useFormationTemplates()
  const { players: teamPlayers }    = useMatchDayPlayers(team?.id)

  // Auto-täytä lineup joukkueen pelaajista kun suunnitelma on uusi (tyhjä lineup)
  useEffect(() => {
    if (!plan || plan.lineup?.length > 0 || !teamPlayers.length) return
    applyFormation(plan.formation, teamPlayers)
  }, [plan?.id, teamPlayers.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const [activeTab,          setActiveTab]          = useState('players')
  const [saving,             setSaving]             = useState(false)
  const [saveTemplateOpen,   setSaveTemplateOpen]   = useState(false)
  const [templateName,       setTemplateName]       = useState('')

  // ── Tallenna suunnitelma ──

  async function handleSave() {
    setSaving(true)
    const { error } = await savePlan()
    setSaving(false)
    if (error) showToast('Tallennus epäonnistui.', 'error')
    else       showToast('Pelipäivä tallennettu ✓', 'success')
  }

  // ── Muodostelman vaihto — täyttää paikat joukkueen pelaajilla ──

  function handleFormationChange(f) {
    applyFormation(f, teamPlayers)
  }

  // ── Siirtää pelaajan vaihtomieslistalle ──

  function handleMoveToSub(player) {
    updateField('substitutes', [...(plan?.substitutes ?? []), player])
  }

  // ── Kokoonpanopohjan tallennus ──

  async function handleSaveTemplate() {
    if (!templateName.trim() || !plan) return
    const { error } = await saveTemplate(templateName.trim(), plan.formation, plan.lineup)
    setSaveTemplateOpen(false)
    setTemplateName('')
    if (error) showToast('Pohjan tallennus epäonnistui.', 'error')
    else       showToast('Pohja tallennettu ✓', 'success')
  }

  // ── Pohjan lataus kokoonpanoon ──

  function handleLoadTemplate(template) {
    updateField('formation', template.formation)
    updateLineup(template.lineup)
  }

  if (loading) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: COLORS.text.secondary }}>Ladataan...</span>
      </div>
    )
  }

  if (!plan) return null

  return (
    <div className={styles.page}>

      {/* ── NAVIGAATIO ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLeft}>
            <button className={styles.backBtn} onClick={() => navigate(ROUTES.DASHBOARD)}>
              ← Takaisin
            </button>
            <span className={styles.navTitle}>Pelipäivä</span>
            {dirty && <span className={styles.dirtyBadge}>● Tallentamatta</span>}
          </div>
          <div className={styles.navActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSaveTemplateOpen(true)}
            >
              Tallenna pohjaksi
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              onClick={handleSave}
            >
              Tallenna
            </Button>
          </div>
        </div>
      </nav>

      <div className={styles.content}>
        <div className={styles.columns}>

          {/* ── VASEN PUOLI ── */}
          <div className={styles.colLeft}>

            {/* Ottelun tiedot */}
            <MatchHeader
              plan={plan}
              homeTeamName={team?.name}
              onChange={updateField}
            />

            {/* Kokoonpanopohjat */}
            <FormationTemplates
              templates={templates}
              onLoad={handleLoadTemplate}
              onSaveCurrent={() => setSaveTemplateOpen(true)}
            />

            {/* Muodostelman valinta */}
            <FormationSelector
              current={plan.formation}
              onChange={handleFormationChange}
            />

            {/* Kenttänäkymä */}
            <MatchFieldCanvas
              lineup={plan.lineup}
              teamPlayers={teamPlayers}
              onLineupChange={updateLineup}
              onMoveToSub={handleMoveToSub}
            />

          </div>

          {/* ── OIKEA PUOLI — VÄLILEHDET ── */}
          <div className={styles.colRight}>

            <div className={styles.tabs}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === 'players' && (
              <PlayerLists
                lineup={plan.lineup}
                substitutes={plan.substitutes}
                absent={plan.absent}
                teamPlayers={teamPlayers}
                onChange={updateField}
              />
            )}

            {activeTab === 'tactics' && (
              <TacticsPanel
                tacticsAttack={plan.tacticsAttack}
                tacticsDefense={plan.tacticsDefense}
                onChange={updateField}
                onOpenEditor={() => navigate(ROUTES.EDITOR)}
              />
            )}

            {activeTab === 'notes' && (
              <NotesPanel
                notes={plan.notes}
                onChange={updateField}
              />
            )}

            {activeTab === 'report' && (
              <MatchReport
                plan={plan}
                onChange={updateField}
              />
            )}

          </div>
        </div>
      </div>

      {/* ── POHJAN TALLENNUSMODAALI ── */}
      <Modal
        isOpen={saveTemplateOpen}
        onClose={() => setSaveTemplateOpen(false)}
        title="Tallenna kokoonpanopohja"
        size="sm"
        footer={
          <>
            <Button variant="primary" onClick={handleSaveTemplate} disabled={!templateName.trim()}>
              Tallenna
            </Button>
            <Button variant="ghost" onClick={() => setSaveTemplateOpen(false)}>Peruuta</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#8b8d97' }}>Anna pohjalle nimi:</label>
          <input
            className={styles.saveTemplateInput}
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder={`${plan.formation} perus`}
            maxLength={40}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTemplate() }}
          />
        </div>
      </Modal>

      <Toast toasts={toasts} />
    </div>
  )
}
