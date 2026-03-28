/**
 * useFormationTemplates.js
 * Kokoonpanopohjien tilan hallinta.
 *
 * Käyttö:
 *   const { templates, saveTemplate, deleteTemplate } = useFormationTemplates()
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  getFormationTemplates,
  saveFormationTemplate,
  deleteFormationTemplate,
} from '../services/matchService'

/**
 * Hakee ja hallinnoi käyttäjän kokoonpanopohjia.
 * @returns {{ templates: Array, saveTemplate: function, deleteTemplate: function }}
 */
export function useFormationTemplates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])

  // Lataa pohjat kirjautumisen jälkeen
  useEffect(() => {
    if (!user?.id) return
    getFormationTemplates(user.id).then(({ data }) => {
      setTemplates(data ?? [])
    })
  }, [user?.id])

  /**
   * Tallentaa uuden kokoonpanopohjan.
   * @param {string} name
   * @param {string} formation
   * @param {Array}  lineup
   * @returns {Promise<{ error: object|null }>}
   */
  const saveTemplate = useCallback(async (name, formation, lineup) => {
    if (!user?.id) return { error: new Error('Ei kirjautunutta käyttäjää') }
    const { data, error } = await saveFormationTemplate({ userId: user.id, name, formation, lineup })
    if (!error && data) setTemplates((prev) => [...prev, data])
    return { error }
  }, [user?.id])

  /**
   * Poistaa kokoonpanopohjan.
   * @param {string} templateId
   * @returns {Promise<{ error: object|null }>}
   */
  const deleteTemplate = useCallback(async (templateId) => {
    const { error } = await deleteFormationTemplate(templateId, user?.id)
    if (!error) setTemplates((prev) => prev.filter((t) => t.id !== templateId))
    return { error }
  }, [user?.id])

  return { templates, saveTemplate, deleteTemplate }
}
