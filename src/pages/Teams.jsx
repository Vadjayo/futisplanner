/**
 * Teams.jsx
 * Joukkueiden hallintasivu. Kokoaa kaikki joukkue- ja pelaajatoiminnot.
 */

import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeams }       from '../hooks/useTeams'
import { usePlayers }     from '../hooks/usePlayers'
import { useToast }       from '../hooks/useToast'
import { useCurrentTeam } from '../store/teamStore'
import { ROUTES }    from '../constants/routes'
import { COLORS }    from '../constants/colors'
import Button          from '../components/ui/Button'
import Modal           from '../components/ui/Modal'
import Toast           from '../components/ui/Toast'
import LoadingSpinner  from '../components/ui/LoadingSpinner'
import TeamSidebar     from '../components/teams/TeamSidebar'
import TeamHeader      from '../components/teams/TeamHeader'
import PlayerTable     from '../components/teams/PlayerTable'
import PlayerFieldView from '../components/teams/PlayerFieldView'
import PlayerModal     from '../components/teams/PlayerModal'
import TeamModal       from '../components/teams/TeamModal'
import CSVImport       from '../components/teams/CSVImport'
import styles          from './Teams.module.css'

export default function TeamsPage() {
  const navigate = useNavigate()
  const { toasts, showToast } = useToast()
  const { switchTeam } = useCurrentTeam()

  const {
    teams,
    selectedTeam,
    selectedId,
    loading: teamsLoading,
    selectTeam,
    createTeam,
    updateTeam,
    deleteTeam,
  } = useTeams()

  const {
    players,
    loading: playersLoading,
    createPlayer,
    updatePlayer,
    deletePlayer: deletePlayerFn,
  } = usePlayers(selectedId)

  // Näkymä: 'list' | 'field'
  const [view, setView] = useState('list')
  // Pelipaikkafiltteri
  const [positionFilter, setPositionFilter] = useState('all')

  // ── Modal-tilat ──
  const [teamModalOpen,  setTeamModalOpen]  = useState(false)
  const [editTeamOpen,   setEditTeamOpen]   = useState(false)
  const [playerModal,    setPlayerModal]    = useState(null)  // null | { mode: 'create'|'edit', player?: object }
  const [deleteTeamOpen, setDeleteTeamOpen] = useState(false)
  const [deleteTeamInput, setDeleteTeamInput] = useState('')
  const [playerToDelete, setPlayerToDelete] = useState(null)  // null | player
  const [csvImportOpen,  setCsvImportOpen]  = useState(false)

  // Suodatettu pelaajataulukko
  const filteredPlayers = useMemo(() =>
    positionFilter === 'all'
      ? players
      : players.filter((p) => p.position === positionFilter),
    [players, positionFilter]
  )

  // Olemassa olevat numerot duplikaattitarkistukseen
  const existingNumbers = useMemo(() =>
    players.map((p) => p.number).filter(Boolean),
    [players]
  )

  // ── JOUKKUETOIMINNOT ──

  /** Luo uusi joukkue lomakkeen tiedoilla */
  async function handleCreateTeam(formData) {
    const { data, error } = await createTeam(formData)
    if (error) { showToast('Joukkueen luonti epäonnistui.', 'error'); return }
    // Synkronoi globaaliin storeen
    if (data) switchTeam(data)
    setTeamModalOpen(false)
    showToast('Joukkue luotu!', 'success')
  }

  /** Tallenna joukkueen muutokset */
  async function handleUpdateTeam(formData) {
    const { error } = await updateTeam(selectedId, {
      name:      formData.name,
      age_group: formData.ageGroup,
      season:    formData.season,
      level:     formData.level,
      coaches:   formData.coaches,
    })
    if (error) { showToast('Tallennus epäonnistui.', 'error'); return }
    setEditTeamOpen(false)
    showToast('Joukkue tallennettu!', 'success')
  }

  /** Poista joukkue (kutsutaan vahvistuksen jälkeen) */
  async function handleDeleteTeam() {
    const { error } = await deleteTeam(selectedId)
    if (error) { showToast('Poisto epäonnistui.', 'error'); return }
    setDeleteTeamOpen(false)
    setDeleteTeamInput('')
    showToast('Joukkue poistettu.', 'success')
  }

  // ── PELAAJATOIMINNOT ──

  /** Tallenna pelaaja (luonti tai muokkaus) */
  async function handleSavePlayer(formData) {
    if (playerModal?.mode === 'edit') {
      const { error } = await updatePlayer(playerModal.player.id, formData)
      if (error) { showToast('Tallennus epäonnistui.', 'error'); return }
      showToast('Pelaaja tallennettu!', 'success')
    } else {
      const { error } = await createPlayer(formData)
      if (error) { showToast('Pelaajan lisäys epäonnistui.', 'error'); return }
      showToast('Pelaaja lisätty!', 'success')
    }
    setPlayerModal(null)
  }

  /** Poista pelaaja (kutsutaan vahvistuksen jälkeen) */
  async function handleDeletePlayer() {
    if (!playerToDelete) return
    const { error } = await deletePlayerFn(playerToDelete.id)
    if (error) { showToast('Poisto epäonnistui.', 'error'); return }
    setPlayerToDelete(null)
    showToast('Pelaaja poistettu.', 'success')
  }

  /** Tuo pelaajat CSV:stä */
  async function handleCsvImport(importedPlayers) {
    const results = await Promise.all(importedPlayers.map((p) => createPlayer(p)))
    const errCount = results.filter((r) => r.error).length
    setCsvImportOpen(false)
    if (errCount > 0) {
      showToast(`${errCount} pelaajan tuonti epäonnistui.`, 'error')
    } else {
      showToast(`${importedPlayers.length} pelaajaa tuotu!`, 'success')
    }
  }

  // Resetoi filtteri joukkueen vaihtuessa ja päivitä globaali store
  const handleSelectTeam = useCallback((teamId) => {
    selectTeam(teamId)
    const team = teams.find((t) => t.id === teamId)
    if (team) switchTeam(team)
    setPositionFilter('all')
    setView('list')
  }, [selectTeam, switchTeam, teams])

  // ── RENDER ──

  if (teamsLoading) return <LoadingSpinner fullPage />

  return (
    <div className={styles.page}>
      {/* Navigaatio */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <button className={styles.navBack} onClick={() => navigate(ROUTES.DASHBOARD)}>
            ← Takaisin
          </button>
          <span className={styles.navTitle}>Joukkueet</span>
        </div>
      </nav>

      <div className={styles.layout}>
        {/* Sivupalkki */}
        <TeamSidebar
          teams={teams}
          selectedId={selectedId}
          onSelect={handleSelectTeam}
          onCreate={() => setTeamModalOpen(true)}
        />

        {/* Pääsisältö */}
        <main className={styles.main}>
          {!selectedTeam ? (
            // Tyhjä tila — ei joukkuetta valittuna
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🏆</span>
              <h2 className={styles.emptyTitle}>Ei joukkuetta valittuna</h2>
              <p className={styles.emptyText}>
                {teams.length === 0
                  ? 'Luo ensimmäinen joukkueesi aloittaaksesi.'
                  : 'Valitse joukkue vasemmalta tai luo uusi.'}
              </p>
              <Button variant="primary" size="md" onClick={() => setTeamModalOpen(true)}>
                + Luo joukkue
              </Button>
            </div>
          ) : (
            <>
              {/* Joukkueen otsikko ja perustiedot */}
              <TeamHeader
                team={selectedTeam}
                onEdit={() => setEditTeamOpen(true)}
                onDelete={() => { setDeleteTeamInput(''); setDeleteTeamOpen(true) }}
              />

              {/* Näkymän vaihto */}
              <div className={styles.viewToggle}>
                <Button
                  variant={view === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setView('list')}
                >
                  Lista
                </Button>
                <Button
                  variant={view === 'field' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setView('field')}
                >
                  Kenttä
                </Button>
              </div>

              {/* Pelaajat */}
              {view === 'list' ? (
                <PlayerTable
                  players={filteredPlayers}
                  loading={playersLoading}
                  positionFilter={positionFilter}
                  onFilterChange={setPositionFilter}
                  onNew={() => setPlayerModal({ mode: 'create' })}
                  onCsvImport={() => setCsvImportOpen(true)}
                  onEdit={(p) => setPlayerModal({ mode: 'edit', player: p })}
                  onDelete={(p) => setPlayerToDelete(p)}
                />
              ) : (
                <PlayerFieldView players={players} />
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Modaalit ── */}

      {/* Luo joukkue */}
      <TeamModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        onSave={handleCreateTeam}
        team={null}
      />

      {/* Muokkaa joukkuetta */}
      <TeamModal
        isOpen={editTeamOpen}
        onClose={() => setEditTeamOpen(false)}
        onSave={handleUpdateTeam}
        team={selectedTeam}
      />

      {/* Pelaaja (luonti / muokkaus) */}
      <PlayerModal
        isOpen={!!playerModal}
        onClose={() => setPlayerModal(null)}
        onSave={handleSavePlayer}
        player={playerModal?.mode === 'edit' ? playerModal.player : null}
        existingNumbers={existingNumbers}
      />

      {/* Poista pelaaja -vahvistus */}
      <Modal
        isOpen={!!playerToDelete}
        onClose={() => setPlayerToDelete(null)}
        title="Poista pelaaja"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPlayerToDelete(null)}>Peruuta</Button>
            <Button variant="danger" onClick={handleDeletePlayer}>Poista pelaaja</Button>
          </>
        }
      >
        <p style={{ color: COLORS.text.light, margin: 0, fontSize: 14 }}>
          Poistetaanko pelaaja <strong>{playerToDelete?.name}</strong>? Toimintoa ei voi peruuttaa.
        </p>
      </Modal>

      {/* Poista joukkue -vahvistus (kirjoitusvahvistus) */}
      <Modal
        isOpen={deleteTeamOpen}
        onClose={() => { setDeleteTeamOpen(false); setDeleteTeamInput('') }}
        title="Poista joukkue"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => { setDeleteTeamOpen(false); setDeleteTeamInput('') }}
            >
              Peruuta
            </Button>
            <Button
              variant="danger"
              disabled={deleteTeamInput !== selectedTeam?.name}
              onClick={handleDeleteTeam}
            >
              Poista joukkue
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: COLORS.text.light, margin: 0, fontSize: 14 }}>
            Tämä poistaa joukkueen ja kaikki{' '}
            <strong>{players.length}</strong> pelaajaa pysyvästi. Toimintoa ei voi peruuttaa.
          </p>
          <p style={{ color: COLORS.text.secondary, margin: 0, fontSize: 13 }}>
            Kirjoita vahvistukseksi joukkueen nimi:{' '}
            <strong style={{ color: COLORS.text.light }}>{selectedTeam?.name}</strong>
          </p>
          <input
            className={styles.deleteInput}
            value={deleteTeamInput}
            onChange={(e) => setDeleteTeamInput(e.target.value)}
            placeholder={selectedTeam?.name}
            autoFocus
          />
        </div>
      </Modal>

      {/* CSV-tuonti */}
      <CSVImport
        isOpen={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        onImport={handleCsvImport}
      />

      {/* Toast-ilmoitukset */}
      <Toast toasts={toasts} />
    </div>
  )
}
