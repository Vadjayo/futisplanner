/**
 * aiProxy.js
 * Lähettää viestin Claude API:lle Vercelin serverless proxyn kautta.
 * Käytetään AI-avustajassa — API-avain ei koskaan selaimessa.
 */

/**
 * Lähettää viestin ja historian Claude API:lle.
 * @param {string} message       - Käyttäjän viesti
 * @param {Array}  history       - Keskusteluhistoria [{ role, content }]
 * @returns {Promise<{ content: string }>}
 */
export async function callClaudeAPI(message, history = []) {
  const url = import.meta.env.VITE_AI_PROXY_URL || '/api/ai'

  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ message, history }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'AI-pyyntö epäonnistui')
  }

  return response.json()
}
