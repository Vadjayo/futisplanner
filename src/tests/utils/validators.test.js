/**
 * validators.test.js
 * Yksikkötestit validointifunktioille.
 */

import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  validatePassword,
  passwordsMatch,
  required,
  validateRegisterForm,
  validateLoginForm,
} from '../../utils/validators'

describe('isValidEmail', () => {
  it('hyväksyy oikean sähköpostin', () => {
    expect(isValidEmail('testi@email.com')).toBe(true)
    expect(isValidEmail('valmentaja@seura.fi')).toBe(true)
    expect(isValidEmail('a@b.c')).toBe(true)
  })

  it('hylkää väärän sähköpostin', () => {
    expect(isValidEmail('ei-validi')).toBe(false)
    expect(isValidEmail('puuttuu-at-merkki.com')).toBe(false)
    expect(isValidEmail('@puuttuva-etuosa.fi')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('validatePassword', () => {
  it('vaatii vähintään 8 merkkiä', () => {
    expect(validatePassword('lyhyt')).not.toBeNull()
    expect(validatePassword('1234567')).not.toBeNull()  // täsmälleen 7
  })

  it('hyväksyy vähintään 8 merkkiä pitkän salasanan', () => {
    expect(validatePassword('tarpeeksipitkä')).toBeNull()
    expect(validatePassword('12345678')).toBeNull()     // täsmälleen 8
  })

  it('hylkää tyhjän salasanan', () => {
    expect(validatePassword('')).not.toBeNull()
    expect(validatePassword(null)).not.toBeNull()
  })
})

describe('passwordsMatch', () => {
  it('palauttaa null kun salasanat täsmäävät', () => {
    expect(passwordsMatch('salasana123', 'salasana123')).toBeNull()
  })

  it('palauttaa virheen kun salasanat eivät täsmää', () => {
    expect(passwordsMatch('salasana123', 'eri123')).not.toBeNull()
  })
})

describe('required', () => {
  it('palauttaa null kun kenttä on täytetty', () => {
    expect(required('arvo')).toBeNull()
  })

  it('palauttaa virheen kun kenttä on tyhjä', () => {
    expect(required('')).not.toBeNull()
    expect(required('   ')).not.toBeNull()  // vain välilyöntejä
    expect(required(null)).not.toBeNull()
  })
})

describe('validateRegisterForm', () => {
  it('palauttaa tyhjän objektin kun kaikki kentät ovat ok', () => {
    const errors = validateRegisterForm({
      name: 'Matti Meikäläinen',
      email: 'matti@email.com',
      password: 'salasana123',
      confirm: 'salasana123',
    })
    expect(errors).toEqual({})
  })

  it('palauttaa virheen puuttuvalle nimelle', () => {
    const errors = validateRegisterForm({
      name: '',
      email: 'matti@email.com',
      password: 'salasana123',
      confirm: 'salasana123',
    })
    expect(errors.name).toBeDefined()
  })

  it('palauttaa virheen väärällä sähköpostilla', () => {
    const errors = validateRegisterForm({
      name: 'Matti',
      email: 'ei-validi',
      password: 'salasana123',
      confirm: 'salasana123',
    })
    expect(errors.email).toBeDefined()
  })

  it('palauttaa virheen liian lyhyelle salasanalle', () => {
    const errors = validateRegisterForm({
      name: 'Matti',
      email: 'matti@email.com',
      password: 'lyhyt',
      confirm: 'lyhyt',
    })
    expect(errors.password).toBeDefined()
  })

  it('palauttaa virheen epätäsmääville salasanoille', () => {
    const errors = validateRegisterForm({
      name: 'Matti',
      email: 'matti@email.com',
      password: 'salasana123',
      confirm: 'eriSalasana',
    })
    expect(errors.confirm).toBeDefined()
  })
})

describe('validateLoginForm', () => {
  it('palauttaa tyhjän objektin kun kentät ovat ok', () => {
    expect(validateLoginForm({ email: 'matti@email.com', password: 'salasana' })).toEqual({})
  })

  it('palauttaa virheen väärällä sähköpostilla', () => {
    const errors = validateLoginForm({ email: 'ei-validi', password: 'salasana' })
    expect(errors.email).toBeDefined()
  })

  it('palauttaa virheen tyhjällä salasanalla', () => {
    const errors = validateLoginForm({ email: 'matti@email.com', password: '' })
    expect(errors.password).toBeDefined()
  })
})
