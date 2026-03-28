/**
 * inputValidation.test.js
 * Testit: Syötteen validointi
 *
 * Varmistaa että sovellus hylkää haitallisen syötteen:
 * XSS-hyökkäykset, SQL-injektio, tyhjät arvot, liian pitkät arvot.
 */

import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePlayerName,
  validateTeamName,
  validateSessionTitle,
} from '../../utils/validators'

// Yleisimmät XSS- ja injektioyritykset
const xssPayloads = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '"><script>alert(1)</script>',
  "'; DROP TABLE users; --",
  '<svg onload=alert(1)>',
  '${alert(1)}',
  '{{constructor.constructor("alert(1)")()}}',
]

describe('XSS-suojaus — pelaajan nimi', () => {
  it('hylkää kaikki XSS-hyötykuormat', () => {
    xssPayloads.forEach(payload => {
      const result = validatePlayerName(payload)
      expect(result.valid, `Odotettiin false payloadille: ${payload}`).toBe(false)
    })
  })

  it('hyväksyy oikean pelaajan nimen', () => {
    expect(validatePlayerName('Mikko Mäkinen').valid).toBe(true)
    expect(validatePlayerName("O'Brien").valid).toBe(true)
    expect(validatePlayerName('Jean-Luc').valid).toBe(true)
    expect(validatePlayerName('Äkäinen 7').valid).toBe(true)
  })
})

describe('XSS-suojaus — joukkueen nimi', () => {
  it('hylkää kaikki XSS-hyötykuormat', () => {
    xssPayloads.forEach(payload => {
      const result = validateTeamName(payload)
      expect(result.valid, `Odotettiin false payloadille: ${payload}`).toBe(false)
    })
  })

  it('hyväksyy oikean joukkueen nimen', () => {
    expect(validateTeamName('HIFK U12').valid).toBe(true)
    expect(validateTeamName('FC HJK 2026').valid).toBe(true)
  })
})

describe('XSS-suojaus — harjoituksen otsikko', () => {
  it('hylkää XSS-skriptit otsikossa', () => {
    xssPayloads.forEach(payload => {
      const result = validateSessionTitle(payload)
      expect(result.valid, `Odotettiin false payloadille: ${payload}`).toBe(false)
    })
  })

  it('hyväksyy normaalin harjoitusotsikon', () => {
    expect(validateSessionTitle('Puolustuspeli maanantai').valid).toBe(true)
    expect(validateSessionTitle('Treeni 2026-04-01').valid).toBe(true)
  })
})

describe('Tyhjä syöte hylätään', () => {
  it('tyhjä pelaajan nimi hylätään', () => {
    expect(validatePlayerName('').valid).toBe(false)
    expect(validatePlayerName('   ').valid).toBe(false)
    expect(validatePlayerName(null).valid).toBe(false)
    expect(validatePlayerName(undefined).valid).toBe(false)
  })

  it('tyhjä joukkueen nimi hylätään', () => {
    expect(validateTeamName('').valid).toBe(false)
    expect(validateTeamName(null).valid).toBe(false)
  })

  it('tyhjä otsikko hylätään', () => {
    expect(validateSessionTitle('').valid).toBe(false)
    expect(validateSessionTitle(null).valid).toBe(false)
  })
})

describe('Liian pitkä syöte hylätään', () => {
  it('yli 100-merkkinen pelaajan nimi hylätään', () => {
    const pitkaNimi = 'A'.repeat(101)
    expect(validatePlayerName(pitkaNimi).valid).toBe(false)
  })

  it('yli 100-merkkinen joukkueen nimi hylätään', () => {
    const pitkaNimi = 'A'.repeat(101)
    expect(validateTeamName(pitkaNimi).valid).toBe(false)
  })

  it('yli 200-merkkinen otsikko hylätään', () => {
    const pitkaOtsikko = 'A'.repeat(201)
    expect(validateSessionTitle(pitkaOtsikko).valid).toBe(false)
  })
})

describe('Sähköpostivalidointi', () => {
  it('hyväksyy oikean sähköpostin', () => {
    expect(validateEmail('testi@futis.fi').valid).toBe(true)
    expect(validateEmail('valmentaja@seura.fi').valid).toBe(true)
  })

  it('hylkää virheellisen sähköpostin', () => {
    expect(validateEmail('ei-sahkoposti').valid).toBe(false)
    expect(validateEmail('@ilman-nimea.fi').valid).toBe(false)
    expect(validateEmail('').valid).toBe(false)
    expect(validateEmail(null).valid).toBe(false)
  })

  it('hylkää XSS-yrityksen sähköpostissa', () => {
    expect(validateEmail('<script>alert(1)</script>@x.fi').valid).toBe(false)
  })
})
