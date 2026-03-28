/**
 * apiProxy.security.test.js
 * Testit: API Proxy tietoturva
 *
 * Varmistaa että Claude API -avain ei koskaan päädy selaimeen.
 * Kaikki AI-pyynnöt menevät oman proxyn kautta — ei suoraan Anthropicille.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mockataan fetch globaalisti
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mockataan import.meta.env
vi.stubEnv('VITE_AI_PROXY_URL', '')

import { callClaudeAPI } from '../../api/aiProxy'

describe('API Proxy tietoturva', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Oletusvastalause — ok-vastaus
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ content: 'Testasvastaus' }),
    })
  })

  // API-avain ei koskaan lähde selaimesta
  it('API-avain ei ole mukana frontend-pyynnössä', async () => {
    await callClaudeAPI('Testikysymys')

    const [, options] = mockFetch.mock.calls[0]
    const body    = JSON.parse(options.body)
    const headers = options.headers ?? {}

    expect(body.api_key).toBeUndefined()
    expect(body.apiKey).toBeUndefined()
    expect(headers['Authorization']).toBeUndefined()
    expect(headers['x-api-key']).toBeUndefined()
    expect(headers['X-Api-Key']).toBeUndefined()
  })

  // Pyyntö ei mene suoraan Anthropic-palvelimelle
  it('pyyntö ei mene suoraan api.anthropic.com -osoitteeseen', async () => {
    await callClaudeAPI('Testikysymys')

    const [url] = mockFetch.mock.calls[0]
    expect(url).not.toContain('api.anthropic.com')
  })

  // Pyyntö menee oman proxyn kautta
  it('pyyntö menee /api/ai -proxyn kautta', async () => {
    await callClaudeAPI('Testikysymys')

    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/ai')
  })

  // VITE_-etuliitteinen API-avain vuotaisi selaimeen
  it('ANTHROPIC_API_KEY ei ole VITE_-ympäristömuuttujana', () => {
    const viteLeak = import.meta.env?.VITE_ANTHROPIC_API_KEY
    // Jos tämä on määritelty, API-avain on vaarassa vuotaa
    expect(viteLeak).toBeUndefined()
  })

  // Pyyntörungossa on vain viesti ja historia — ei arkaluonteista tietoa
  it('pyyntörunko sisältää vain message ja history', async () => {
    await callClaudeAPI('Hei', [{ role: 'user', content: 'Edellinen' }])

    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)

    expect(body.message).toBe('Hei')
    expect(body.history).toHaveLength(1)
    // Ei muita kenttiä kuin message ja history
    const extraKeys = Object.keys(body).filter(k => !['message', 'history'].includes(k))
    expect(extraKeys).toHaveLength(0)
  })

  // 403 Forbidden heittää virheen
  it('proxy palauttaa 403 Forbidden — heitetään virhe', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Forbidden' }),
    })

    await expect(callClaudeAPI('Testikysymys')).rejects.toThrow()
  })

  // Verkkovirhe heitetään käyttäjälle
  it('verkkovirhe heitetään eteenpäin', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(callClaudeAPI('Testikysymys')).rejects.toThrow()
  })

  // Content-Type on application/json — ei muuta
  it('Content-Type on application/json', async () => {
    await callClaudeAPI('Testikysymys')

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers['Content-Type']).toBe('application/json')
  })

  // Metodi on POST
  it('käyttää POST-metodia', async () => {
    await callClaudeAPI('Testikysymys')

    const [, options] = mockFetch.mock.calls[0]
    expect(options.method).toBe('POST')
  })

  // Vastaus palautetaan oikein
  it('vastaus palautetaan kutsujalle', async () => {
    const result = await callClaudeAPI('Testikysymys')
    expect(result.content).toBe('Testasvastaus')
  })
})
