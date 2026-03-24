// Kentän taustapiirros — renderöi kenttätyypin mukaiset viivat ja maalit
// Kaikki mitat loogisissa koordinaateissa (1000×650) ja skaalataan scale-propilla

import { Rect, Line, Circle, Text } from 'react-konva'

const GRASS = '#2d5a27'                    // nurmikon vihreä
const LINE  = 'rgba(255,255,255,0.88)'    // kenttäviivat
const GOAL_LINE = '#fbbf24'               // maalin reunaviiva (keltainen)

export default function FieldBackground({ fieldType, scale: s }) {
  const W = 1000
  const H = 650
  const lw = 2 * s // viivan paksuus

  if (fieldType === '11v11') {
    // 105m × 68m kenttä — pikseli/metri: sx≈9.52, sy≈9.56
    const pa_depth = 157 * s   // rangaistusalue syvyys (16.5m)
    const pa_h     = 386 * s   // rangaistusalue leveys (40.32m)
    const pa_y     = ((H - 386) / 2) * s

    const ga_depth = 52 * s    // maalipalue syvyys (5.5m)
    const ga_h     = 175 * s   // maalipalue leveys (18.32m)
    const ga_y     = ((H - 175) / 2) * s

    const goal_y   = ((H - 70) / 2) * s   // maali (7.32m ≈ 70px)
    const goal_h   = 70 * s

    const cr   = 87 * s    // keskiympyrän säde (9.15m)
    const ps_x = 105 * s   // rangaistuslaukaisupiste (11m maalilinjalta)

    return (
      <>
        {/* Nurmi ja kenttäraja */}
        <Rect x={0} y={0} width={W * s} height={H * s} fill={GRASS} />
        <Rect x={0} y={0} width={W * s} height={H * s} stroke={LINE} strokeWidth={lw} fill="transparent" />

        {/* Keskiviiva */}
        <Line points={[(W / 2) * s, 0, (W / 2) * s, H * s]} stroke={LINE} strokeWidth={lw} />

        {/* Keskiympyrä ja -piste */}
        <Circle x={(W / 2) * s} y={(H / 2) * s} radius={cr} stroke={LINE} strokeWidth={lw} fill="transparent" />
        <Circle x={(W / 2) * s} y={(H / 2) * s} radius={4 * s} fill={LINE} />

        {/* Vasen rangaistusalue */}
        <Rect x={0} y={pa_y} width={pa_depth} height={pa_h} stroke={LINE} strokeWidth={lw} fill="transparent" />

        {/* Vasen maalipalue */}
        <Rect x={0} y={ga_y} width={ga_depth} height={ga_h} stroke={LINE} strokeWidth={lw} fill="transparent" />

        {/* Vasen maali (keltainen viiva maalilinjalla) */}
        <Line points={[lw / 2, goal_y, lw / 2, goal_y + goal_h]} stroke={GOAL_LINE} strokeWidth={6 * s} lineCap="round" />

        {/* Vasen rangaistuslaukaisupiste */}
        <Circle x={ps_x} y={(H / 2) * s} radius={3.5 * s} fill={LINE} />

        {/* Oikea rangaistusalue */}
        <Rect x={(W - 157) * s} y={pa_y} width={pa_depth} height={pa_h} stroke={LINE} strokeWidth={lw} fill="transparent" />

        {/* Oikea maalipalue */}
        <Rect x={(W - 52) * s} y={ga_y} width={ga_depth} height={ga_h} stroke={LINE} strokeWidth={lw} fill="transparent" />

        {/* Oikea maali */}
        <Line points={[W * s - lw / 2, goal_y, W * s - lw / 2, goal_y + goal_h]} stroke={GOAL_LINE} strokeWidth={6 * s} lineCap="round" />

        {/* Oikea rangaistuslaukaisupiste */}
        <Circle x={(W - 105) * s} y={(H / 2) * s} radius={3.5 * s} fill={LINE} />
      </>
    )
  }

  if (fieldType === '7v7') {
    const pa_y   = ((H - 300) / 2) * s
    const goal_y = ((H - 90) / 2) * s
    const goal_h = 90 * s

    return (
      <>
        <Rect x={0} y={0} width={W * s} height={H * s} fill={GRASS} />
        <Rect x={0} y={0} width={W * s} height={H * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
        <Line points={[(W / 2) * s, 0, (W / 2) * s, H * s]} stroke={LINE} strokeWidth={lw} />
        <Circle x={(W / 2) * s} y={(H / 2) * s} radius={80 * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
        <Circle x={(W / 2) * s} y={(H / 2) * s} radius={4 * s} fill={LINE} />
        {/* Rangaistusalueet */}
        <Rect x={0} y={pa_y} width={130 * s} height={300 * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
        <Rect x={(W - 130) * s} y={pa_y} width={130 * s} height={300 * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
        {/* Maalit */}
        <Line points={[lw / 2, goal_y, lw / 2, goal_y + goal_h]} stroke={GOAL_LINE} strokeWidth={6 * s} lineCap="round" />
        <Line points={[W * s - lw / 2, goal_y, W * s - lw / 2, goal_y + goal_h]} stroke={GOAL_LINE} strokeWidth={6 * s} lineCap="round" />
      </>
    )
  }

  if (fieldType === '5v5') {
    const ga_y   = ((H - 180) / 2) * s
    const goal_y = ((H - 100) / 2) * s
    const goal_h = 100 * s

    return (
      <>
        <Rect x={0} y={0} width={W * s} height={H * s} fill={GRASS} />
        <Rect x={0} y={0} width={W * s} height={H * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
        <Line points={[(W / 2) * s, 0, (W / 2) * s, H * s]} stroke={LINE} strokeWidth={lw} />
        <Circle x={(W / 2) * s} y={(H / 2) * s} radius={4 * s} fill={LINE} />
        {/* Maalipalue-alueet */}
        <Rect x={0} y={ga_y} width={80 * s} height={180 * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
        <Rect x={(W - 80) * s} y={ga_y} width={80 * s} height={180 * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
        <Line points={[lw / 2, goal_y, lw / 2, goal_y + goal_h]} stroke={GOAL_LINE} strokeWidth={6 * s} lineCap="round" />
        <Line points={[W * s - lw / 2, goal_y, W * s - lw / 2, goal_y + goal_h]} stroke={GOAL_LINE} strokeWidth={6 * s} lineCap="round" />
      </>
    )
  }

  // Tyhjä kenttä — pelkkä nurmi, ei viivoja
  if (fieldType === 'blank') {
    return <Rect x={0} y={0} width={W * s} height={H * s} fill={GRASS} />
  }

  // Jaettu kenttä — kaksi puoliskoa rinnakkain, selkeä jakoviiva keskellä
  // Idea: yksi kanvas, kaksi erillistä harjoitusta vierekkäin
  if (fieldType === 'split') {
    const MID = (W / 2) * s
    return (
      <>
        {/* Vasen puoli — hieman vaaleampi sävy erottumiseksi */}
        <Rect x={0} y={0} width={MID} height={H * s} fill="#315f2b" />
        {/* Oikea puoli — normaali sävy */}
        <Rect x={MID} y={0} width={MID} height={H * s} fill={GRASS} />
        {/* Ulkoraja */}
        <Rect x={0} y={0} width={W * s} height={H * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
        {/* Jakoviiva */}
        <Line
          points={[MID, 0, MID, H * s]}
          stroke={LINE} strokeWidth={lw}
        />
        {/* Puoliskojen tunnisteet — A vasemmalla, B oikealla */}
        <Text
          text="A" x={20 * s} y={20 * s}
          fontSize={28 * s} fontStyle="bold" fill="rgba(255,255,255,0.25)"
          listening={false}
        />
        <Text
          text="B" x={(W / 2 + 20) * s} y={20 * s}
          fontSize={28 * s} fontStyle="bold" fill="rgba(255,255,255,0.25)"
          listening={false}
        />
      </>
    )
  }

  // 3v3 — yksinkertaistettu kenttä keskiviivalla ja maaleilla
  const goal_y = ((H - 80) / 2) * s
  const goal_h = 80 * s

  return (
    <>
      <Rect x={0} y={0} width={W * s} height={H * s} fill={GRASS} />
      <Rect x={0} y={0} width={W * s} height={H * s} stroke={LINE} strokeWidth={lw} fill="transparent" />
      <Line points={[(W / 2) * s, 0, (W / 2) * s, H * s]} stroke={LINE} strokeWidth={lw} />
      <Circle x={(W / 2) * s} y={(H / 2) * s} radius={4 * s} fill={LINE} />
      <Line points={[lw / 2, goal_y, lw / 2, goal_y + goal_h]} stroke={GOAL_LINE} strokeWidth={6 * s} lineCap="round" />
      <Line points={[W * s - lw / 2, goal_y, W * s - lw / 2, goal_y + goal_h]} stroke={GOAL_LINE} strokeWidth={6 * s} lineCap="round" />
    </>
  )
}
