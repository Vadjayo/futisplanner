// useInlineEdit — inline-muokkauksen tila yhdessä hookissa
// Käytetään TopBarissa (session nimi) ja DrillCardissa (harjoitteen otsikko)

import { useState } from 'react'

// value = nykyinen arvo ulkoapäin, onCommit = kutsutaan kun muokkaus vahvistetaan
export function useInlineEdit(value, onCommit) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function startEdit() {
    setDraft(value) // synkronoi nykyiseen arvoon ennen muokkauksen aloitusta
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    onCommit(draft)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') e.target.blur()
    if (e.key === 'Escape') {
      setDraft(value) // peruuta — palauta vanhaan arvoon
      setEditing(false)
    }
  }

  return { editing, draft, setDraft, startEdit, commit, handleKeyDown }
}
