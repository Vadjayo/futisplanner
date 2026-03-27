/**
 * aiElementConverter.js
 * Muuntaa AI:n JSON-elementit Konva.js-objekteiksi.
 */

/**
 * Muuntaa yksittäisen AI-elementin Konva-objektiksi.
 * @param {object} el  - AI:n palauttama elementti
 * @param {string} id  - Yksikäsitteinen tunniste
 * @returns {object|null}
 */
export function convertAIElement(el, id) {
  const base = {
    id:        id || `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    x:         el.x,
    y:         el.y,
    draggable: true,
    source:    'ai',
  }

  switch (el.type) {
    case 'player':
      return { ...base, type: 'player', color: el.color || '#2563EB', number: el.number || 1 }
    case 'cone':
      return { ...base, type: 'cone' }
    case 'pole':
      return { ...base, type: 'pole' }
    case 'goal':
      return { ...base, type: 'goal', side: el.side || 'left' }
    case 'small_goal':
      return { ...base, type: 'small_goal', rotation: el.rotation || 0 }
    case 'ball':
      return { ...base, type: 'ball' }
    case 'ring':
      return { ...base, type: 'ring' }
    case 'mannequin':
      return { ...base, type: 'mannequin' }
    case 'arrow':
      return {
        id: base.id, type: 'arrow',
        x1: el.x1, y1: el.y1,
        x2: el.x2, y2: el.y2,
        arrowType: el.arrowType || 'pass',
        source: 'ai',
      }
    case 'zone':
      return { ...base, type: 'zone', width: el.width || 150, height: el.height || 100 }
    default:
      console.warn('Tuntematon elementtityyppi:', el.type)
      return null
  }
}

/**
 * Muuntaa AI:n elementtilistan Konva-objekteiksi.
 * Suodattaa tuntemattomat elementtityypit pois.
 * @param {Array} elements - AI:n palauttamat elementit
 * @returns {Array}
 */
export function convertAIElements(elements) {
  return elements
    .map((el, i) => convertAIElement(el, `ai-${Date.now()}-${i}`))
    .filter(Boolean)
}
