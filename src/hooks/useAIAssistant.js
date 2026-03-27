/**
 * useAIAssistant.js
 * AI-avustajan tilan hallinta treenisuunnittelijassa.
 * Hallitsee viestit, historian ja elementtien hyväksynnän.
 */

import { useState, useCallback } from 'react'
import { callClaudeAPI } from '../api/aiProxy'

/** Aloitusviesti kun paneeli avataan */
const WELCOME_MESSAGE = {
  id:   1,
  role: 'ai',
  text: 'Hei! Kuvaile harjoite ja lisään elementit kentälle. Esim: "Passelirinki 6 pelaajaa, tötsät keskelle"',
}

/**
 * Rakentaa luettavan vastauksen AI:n JSON-datasta.
 * @param {object} parsed - AI:n jäsennetty vastaus
 * @returns {string}
 */
function buildResponseText(parsed) {
  const counts = parsed.elements.reduce((acc, el) => {
    acc[el.type] = (acc[el.type] || 0) + 1
    return acc
  }, {})

  const parts = []
  if (counts.player)     parts.push(`${counts.player} pelaajaa`)
  if (counts.cone)       parts.push(`${counts.cone} tötsää`)
  if (counts.pole)       parts.push(`${counts.pole} keppiä`)
  if (counts.arrow)      parts.push(`${counts.arrow} nuolta`)
  if (counts.goal)       parts.push(`${counts.goal} maalia`)
  if (counts.small_goal) parts.push(`${counts.small_goal} pienmaalia`)
  if (counts.zone)       parts.push(`${counts.zone} vyöhykettä`)
  if (counts.ball)       parts.push(`${counts.ball} palloa`)
  if (counts.ring)       parts.push(`${counts.ring} rengasta`)
  if (counts.mannequin)  parts.push(`${counts.mannequin} mannekiinia`)

  return `Lisäsin: ${parts.join(', ')}.\n${parsed.description ?? ''}`
}

/**
 * AI-avustajan tilan hallinta.
 * @param {object}   options
 * @param {function} options.onElementsGenerated - Callback kun elementit hyväksytään kentälle
 * @returns {object}
 */
export function useAIAssistant({ onElementsGenerated }) {
  const [messages,        setMessages]        = useState([WELCOME_MESSAGE])
  const [history,         setHistory]         = useState([])
  const [loading,         setLoading]         = useState(false)
  const [pendingElements, setPendingElements] = useState(null)

  /**
   * Lähettää viestin AI:lle ja käsittelee vastauksen.
   * @param {string} userMessage
   */
  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage?.trim() || loading) return

    // Lisää käyttäjän viesti näkymään
    const userMsg = { id: Date.now(), role: 'user', text: userMessage }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const response = await callClaudeAPI(userMessage, history)

      // Päivitä keskusteluhistoria seuraavaa pyyntöä varten
      setHistory((prev) => [
        ...prev,
        { role: 'user',      content: userMessage        },
        { role: 'assistant', content: response.content   },
      ])

      // Parsitaan JSON-vastaus
      const parsed = JSON.parse(response.content)

      // Tarkennuspyyntö — AI haluaa lisätietoja
      if (parsed.clarification) {
        setMessages((prev) => [...prev, {
          id:   Date.now(),
          role: 'ai',
          text: parsed.clarification,
          type: 'clarification',
        }])
        return
      }

      // Elementit odottavat valmentajan hyväksyntää
      setPendingElements(parsed.elements)
      setMessages((prev) => [...prev, {
        id:       Date.now(),
        role:     'ai',
        text:     buildResponseText(parsed),
        tip:      parsed.coaching_tip,
        elements: parsed.elements,
        type:     'elements',
      }])

    } catch (error) {
      console.error('AI-avustaja virhe:', error)
      setMessages((prev) => [...prev, {
        id:   Date.now(),
        role: 'ai',
        text: 'Pahoittelut, jokin meni pieleen. Yritä uudelleen.',
        type: 'error',
      }])
    } finally {
      setLoading(false)
    }
  }, [history, loading])

  /**
   * Valmentaja hyväksyy — elementit lisätään kentälle.
   */
  const approveElements = useCallback(() => {
    if (!pendingElements) return
    onElementsGenerated(pendingElements)
    setPendingElements(null)
  }, [pendingElements, onElementsGenerated])

  /**
   * Valmentaja hylkää — elementit poistetaan ehdotuksesta.
   */
  const rejectElements = useCallback(() => {
    setPendingElements(null)
    setMessages((prev) => [...prev, {
      id:   Date.now(),
      role: 'ai',
      text: 'Ok, ei lisätty. Kokeile uudelleen!',
    }])
  }, [])

  /**
   * Tyhjentää keskustelun ja historian.
   */
  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE])
    setHistory([])
    setPendingElements(null)
  }, [])

  return {
    messages,
    loading,
    pendingElements,
    sendMessage,
    approveElements,
    rejectElements,
    clearChat,
  }
}
