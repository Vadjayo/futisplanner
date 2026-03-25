/**
 * teamService.js
 * Joukkueiden ja kausisuunnittelun CRUD-operaatiot. Aiemmin lib/seasonDb.js.
 * Siirretään koodi tähän Vaiheessa 2 — tällä hetkellä uudelleenvienti.
 *
 * Rajapinta:
 *   loadTeams(userId)
 *   createTeam(userId)
 *   updateTeam(id, patch)
 *   deleteTeam(id)
 */

export { loadTeams, createTeam, updateTeam, deleteTeam } from '../lib/seasonDb'
