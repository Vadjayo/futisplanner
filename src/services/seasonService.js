/**
 * seasonService.js
 * Kalenteri-tapahtumien CRUD-operaatiot. Aiemmin osa lib/seasonDb.js.
 * Siirretään koodi tähän Vaiheessa 2 — tällä hetkellä uudelleenvienti.
 *
 * Rajapinta:
 *   loadEvents(teamId)
 *   addEvent(event)
 *   addEvents(events[])
 *   updateEvent(id, patch)
 *   deleteEvent(id)
 *   deleteFutureRecurring(recurringId, fromDate)
 */

export { loadEvents, addEvent, addEvents, updateEvent, deleteEvent, deleteFutureRecurring } from '../lib/seasonDb'
