/**
 * fieldElements.js
 * Kentän elementtityyppien vakiot. Aiemmin hajallaan DrillCanvas.jsx:ssä ja
 * LeftToolbar.jsx:ssä.
 *
 * Tyypit: player, gk, defender, ball, cone, pole, coach, text, arrow
 */

// Kaikki tuetut elementtityypit
export const ELEMENT_TYPES = {
  PLAYER:   'player',
  GK:       'gk',
  DEFENDER: 'defender',
  BALL:     'ball',
  CONE:     'cone',
  POLE:     'pole',
  COACH:    'coach',
  TEXT:     'text',
  ARROW:    'arrow',
}

// Pelaajien roolivärit (vastaa DrillCanvas.jsx ROLE_COLORS -mappauksen arvoja)
export const ROLE_COLORS = {
  blue:  '#2563eb',
  red:   '#dc2626',
  green: '#16a34a',
  dark:  '#374151',
  gk:    '#f59e0b',
  home:  '#2563eb',
  away:  '#dc2626',
}

// Oletuskoot (skaalamattomat, kerrotaan canvasScale:lla renderöinnissä)
export const ELEMENT_DEFAULTS = {
  player:   { radius: 14 },
  gk:       { radius: 14 },
  defender: { radius: 14, sides: 3 },
  ball:     { radius: 10 },
  cone:     { radius: 8, sides: 3 },
  pole:     { width: 5, height: 24 },
  coach:    { radius: 14 },
}
