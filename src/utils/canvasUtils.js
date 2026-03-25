/**
 * canvasUtils.js
 * Konva-kanvaan apufunktiot. Aiemmin hajallaan DrillCanvas.jsx:ssä.
 */

/**
 * Muuntaa klienttikoordinaatit kanvaan suhteellisiksi koordinaateiksi
 * @param {Konva.Stage} stage
 * @param {number} clientX
 * @param {number} clientY
 * @returns {{ x: number, y: number }}
 */
export function clientToCanvas(stage, clientX, clientY) {
  const rect  = stage.container().getBoundingClientRect()
  const scale = stage.scaleX()
  return {
    x: (clientX - rect.left) / scale,
    y: (clientY - rect.top)  / scale,
  }
}

/**
 * Laskee kiertokulman hiiren vierityksen perusteella
 * Positiivinen delta = myötäpäivään
 * @param {WheelEvent} e
 * @param {number} currentRotation
 * @param {number} step  — askelkoko asteina (oletus 5)
 * @returns {number}
 */
export function calcRotation(e, currentRotation, step = 5) {
  const delta = e.evt?.deltaY ?? e.deltaY ?? 0
  return currentRotation + (delta > 0 ? step : -step)
}

/**
 * Rakentaa kuukausiruudukon Konva-rendertystä varten
 * Palauttaa taulukon viikkoja (kukin viikko = 7 Date | null)
 * @param {number} year
 * @param {number} month  — 0-indeksoitu
 * @returns {(Date|null)[][]}
 */
export function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7 // 0 = maanantai

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= lastDate; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
