/**
 * fieldElements.js
 * Kentän elementtityyppien ja nuolityyppien määritykset.
 * Käytetään LeftToolbar.jsx:ssä ja DrillCanvas.jsx:ssä.
 *
 * Käyttö: import { FIELD_ELEMENTS } from '@/constants'
 */

export const FIELD_ELEMENTS = {
  PLAYERS: {
    GOALKEEPER:     { color: '#EF9F27', label: 'Maalivahti' },
    ATTACKER_BLUE:  { color: '#2563EB', label: 'Hyökkääjä (sin)' },
    ATTACKER_RED:   { color: '#DC2626', label: 'Hyökkääjä (pun)' },
    ATTACKER_GREEN: { color: '#16A34A', label: 'Hyökkääjä (vih)' },
    DEFENDER_BLUE:  { color: '#2563EB', shape: 'triangle', label: 'Puolustaja (sin)' },
    DEFENDER_RED:   { color: '#DC2626', shape: 'triangle', label: 'Puolustaja (pun)' },
  },
  EQUIPMENT: {
    CONE:       { color: '#F97316', label: 'Tötsä' },
    POLE:       { color: '#EAB308', label: 'Keppi' },
    GOAL:       { label: 'Maali' },
    SMALL_GOAL: { label: 'Pienmaali' },
    BALL:       { label: 'Pallo' },
    RING:       { color: '#F97316', label: 'Rengas' },
    LADDER:     { color: '#EAB308', label: 'Tikkaat' },
    MANNEQUIN:  { color: '#94A3B8', label: 'Mannekiini' },
    MINI_FIELD: { label: 'Pienkenttä' },
  },
  ARROWS: {
    PASS:         { dash: null,   color: 'white',    label: 'Syöttö' },
    MOVE:         { dash: [6, 4], color: 'white',    label: 'Liike' },
    SHOT:         { color: '#E24B4A',                label: 'Laukaus' },
    DRIBBLE:      { color: '#E24B4A', curve: true,   label: 'Kuljetus' },
    CURVE:        { color: '#EF9F27',                label: 'Kaareva' },
    BOTH_WAYS:    { color: '#378ADD', bothEnds: true, label: 'Edestakaisin' },
    WITHOUT_BALL: { dash: [4, 4], color: '#7F77DD',  label: 'Ilman palloa' },
  },
}
