// Harjoituksen Konva-kanvas – piirtää kaikki kenttäelementit ja hallitsee käyttäjän vuorovaikutusta
import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import {
  Stage, Layer, Group,
  Circle, Rect, RegularPolygon, Arrow, Line, Shape,
  Text as KonvaText, Transformer,
} from 'react-konva'
import FieldBackground from './FieldBackground'
import { useAnimationEngine, getAnimatedPos } from '../../hooks/useAnimationEngine'
import { CONE_HEX, DRAW_HEX } from '../../constants/colors'
import styles from './DrillCanvas.module.css'

// Kentän looginen koko pikseleinä – skaalaus lasketaan tästä suhteessa kontainerin leveyteen
const FIELD_W = 1000
const FIELD_H = 650

// Palauttaa nuolityyliin liittyvät visuaaliset parametrit tyypin ja skaalauskertoimen mukaan
function getArrowStyle(arrowType, s) {
  switch (arrowType) {
    case 'syotto':
      return { stroke: 'white',    fill: 'white',    strokeWidth: 2.5*s, dash: null,           pLen: 10*s, pWidth: 8*s }
    case 'liike':
      return { stroke: 'white',    fill: 'white',    strokeWidth: 2*s,   dash: [8*s, 5*s],     pLen: 9*s,  pWidth: 7*s }
    case 'laukaus':
      return { stroke: '#f97316',  fill: '#f97316',  strokeWidth: 3.5*s, dash: null,           pLen: 14*s, pWidth: 10*s }
    case 'kuljetus':
      return { stroke: '#fbbf24',  fill: '#fbbf24',  strokeWidth: 2.5*s, dash: [3*s, 4*s],     pLen: 10*s, pWidth: 8*s }
    default:
      return { stroke: 'white',    fill: 'white',    strokeWidth: 2.5*s, dash: null,           pLen: 10*s, pWidth: 8*s }
  }
}

// Laskee aaltoviivan pisteet kuljetusnuolelle – simuloi pallon pompottelua
// Palaa suoraan viivaan viimeisten 12 yksikön matkalla nuolenpäätä varten
function getKuljetusPoints(x1, y1, x2, y2, scale) {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.sqrt(dx * dx + dy * dy)
  // Liian lyhyt viiva – ei aalloiteta
  if (length < 5) return [x1 * scale, y1 * scale, x2 * scale, y2 * scale]
  const ux = dx / length, uy = dy / length
  const px = -uy, py = ux // kohtisuora vektori aallon sivusuunnalle
  const amplitude = 7
  const wavelength = 30
  const lineEnd = Math.max(0, length - 12) // viimeinen 12 yksikköä suora (nuolenpää)
  const numPoints = Math.max(8, Math.ceil(lineEnd / 4))
  const pts = []
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const along = t * lineEnd
    // Siniaalto kohtisuoraan liikesuuntaan nähden
    const wave = amplitude * Math.sin((along / wavelength) * 2 * Math.PI)
    pts.push((x1 + along * ux + wave * px) * scale, (y1 + along * uy + wave * py) * scale)
  }
  // Lisätään loppupiste suoraan nuolenpäähän
  pts.push(x2 * scale, y2 * scale)
  return pts
}

// Pääkomponentti: Konva-pohjainen harjoituskenttä
// Props: elements – kenttäelementtien lista, fieldType – kentän tyyppi,
//        activeTool – valittu työkalu, toolOptions – lisäasetukset, onChange – elementit päivitetty
// Ref: exposoi getImageDataUrl() PDF-vientiä varten
const DrillCanvas = forwardRef(function DrillCanvas({ elements, fieldType, activeTool, toolOptions, onChange }, ref) {
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const trRef = useRef(null) // Konva Transformer -viite valitun elementin muokkaamiseen

  // Exposoi getImageDataUrl() ref:n kautta PDF-vientiä varten (pixelRatio=2 = terävä kuva)
  useImperativeHandle(ref, () => ({
    getImageDataUrl: () => stageRef.current?.toDataURL({ pixelRatio: 2 }),
  }))

  const [stageWidth, setStageWidth] = useState(800)
  const [selectedId, setSelectedId] = useState(null)
  const [deleteBtnPos, setDeleteBtnPos] = useState(null) // Poista-napin sijainti pikseleissä
  const [drawingArrow, setDrawingArrow] = useState(null) // Kesken oleva nuolenpiirto
  const [drawingShape, setDrawingShape] = useState(null) // Kesken oleva muodonpiirto
  const [editingText, setEditingText] = useState(null)   // Tekstielementti, jota muokataan

  // Skaalauskerroin: looginen kenttäleveys sovitetaan kontainerin pikselileveyteen
  const scale = stageWidth / FIELD_W
  const stageHeight = FIELD_H * scale

  // ── ANIMAATIO ──
  const {
    animSelectedId, setAnimSelectedId,
    isPlaying, animProgress, animProgressRef,
    playAnim, pauseAnim, resetAnim, resetAll,
  } = useAnimationEngine({ stageRef, elements, scale })

  // Seurataan kontainerin leveyttä ResizeObserverilla – päivitetään skaalaus automaattisesti
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      if (w > 0) setStageWidth(w)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Poistetaan valinta aina kun työkalu vaihtuu pois valinta-tilasta
  useEffect(() => {
    if (activeTool !== 'select') setSelectedId(null)
  }, [activeTool])

  // Pysäytetään animaatio ja nollataan tila kun poistutaan animaatiotilasta
  useEffect(() => {
    if (activeTool !== 'animate') resetAll()
  }, [activeTool]) // eslint-disable-line react-hooks/exhaustive-deps

  // Päivitetään Transformer-solmu ja poista-napin sijainti aina kun valinta muuttuu
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return
    if (selectedId) {
      const node = stageRef.current.findOne(`#el_${selectedId}`)
      if (node) {
        trRef.current.nodes([node])
        trRef.current.getLayer()?.batchDraw()
        // Asetetaan poista-nappi Transformerin oikean yläkulman viereen
        const box = trRef.current.getClientRect()
        setDeleteBtnPos({ x: box.x + box.width, y: box.y })
      }
    } else {
      trRef.current.nodes([])
      trRef.current.getLayer()?.batchDraw()
      setDeleteBtnPos(null)
    }
  }, [selectedId, elements])

  // Poistaa valitun elementin elementtilistasta
  function deleteSelected() {
    onChange(elements.filter((el) => el.id !== selectedId))
    setSelectedId(null)
    setDeleteBtnPos(null)
  }

  // Delete/Backspace poistaa valitun elementin – ei toimi tekstitilan aikana
  useEffect(() => {
    function handleKey(e) {
      if (editingText) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        onChange(elements.filter((el) => el.id !== selectedId))
        setSelectedId(null)
        setDeleteBtnPos(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedId, elements, onChange, editingText])

  // Muuntaa Stage-koordinaatit loogisiksi kenttäkoordinaateiksi
  function toLogical(stageX, stageY) {
    return { x: stageX / scale, y: stageY / scale }
  }

  // Hakee hiiren tai sormen sijainnin loogisina koordinaatteina
  function getPointerLogical() {
    const pos = stageRef.current.getPointerPosition()
    return toLogical(pos.x, pos.y)
  }

  // Etsii seuraavan vapaan pelaajanuomeron annetulle joukkueelle (1–22)
  function nextPlayerNumber(team) {
    const nums = elements
      .filter((el) => el.type === 'player' && el.team === team)
      .map((el) => el.number)
    for (let i = 1; i <= 22; i++) {
      if (!nums.includes(i)) return i
    }
    // Yli 22 pelaajaa – käytetään listan pituutta varanuomerana
    return nums.length + 1
  }

  // Luo uuden elementin annettuun Stage-koordinaattiin aktiivisen työkalun mukaan
  function addElement(stagePos) {
    const { x, y } = toLogical(stagePos.x, stagePos.y)
    const id = crypto.randomUUID()
    const team = toolOptions?.playerTeam ?? 'home'
    const coneColor = toolOptions?.coneColor ?? 'orange'

    let newEl
    switch (activeTool) {
      case 'player':
        newEl = { id, type: 'player', x, y, number: nextPlayerNumber(team), team, shape: toolOptions?.playerShape ?? 'att', rotation: 0 }
        break
      case 'coach':
        newEl = { id, type: 'coach', x, y }
        break
      case 'ball':
        newEl = { id, type: 'ball', x, y }
        break
      case 'cone':
        newEl = { id, type: 'cone', x, y, color: coneColor }
        break
      case 'pole':
        newEl = { id, type: 'pole', x, y, color: toolOptions?.poleColor ?? 'yellow' }
        break
      case 'smallgoal':
        newEl = { id, type: 'smallgoal', x, y, rotation: 0 }
        break
      case 'goal':
        newEl = { id, type: 'goal', x, y, rotation: 0 }
        break
      case 'ladder':
        newEl = { id, type: 'ladder', x, y, rotation: 0 }
        break
      case 'hurdle':
        newEl = { id, type: 'hurdle', x, y, rotation: 0 }
        break
      case 'text':
        newEl = { id, type: 'text', x, y, text: 'Teksti' }
        break
      default:
        return
    }

    onChange([...elements, newEl])
    // Avataan tekstieditori heti kun tekstielementti lisätään
    if (activeTool === 'text') {
      setEditingText({ id, x: stagePos.x, y: stagePos.y, text: 'Teksti' })
    }
  }

  // Käsittelee klikkaukset Stagella – nuoli/viiva/ympyrä/vapaapiirto ohitetaan (ne käyttävät mousedown/up)
  function handleStageClick(e) {
    if (['arrow', 'line', 'circle', 'freehand'].includes(activeTool)) return
    const isBackground = e.target === e.target.getStage() ||
      (e.target.getClassName?.() === 'Rect' && !e.target.id())

    // Animaatiotila: klikkaus taustaan lisää reittipisteen valitulle elementille
    if (activeTool === 'animate') {
      if (isBackground && animSelectedId) {
        const { x, y } = getPointerLogical()
        onChange(elements.map((el) =>
          el.id === animSelectedId
            ? { ...el, animPath: [...(el.animPath ?? []), { x, y }] }
            : el
        ))
      }
      return
    }

    if (activeTool === 'select') {
      // Klikkaus taustaan poistaa valinnan
      if (isBackground) setSelectedId(null)
      return
    }
    addElement(stageRef.current.getPointerPosition())
  }

  // Aloittaa nuolen tai muodon piirtämisen hiiren painalluksesta
  function handleMouseDown() {
    const { x, y } = getPointerLogical()
    if (activeTool === 'arrow') {
      setDrawingArrow({ x1: x, y1: y, x2: x, y2: y })
    } else if (activeTool === 'line' || activeTool === 'circle') {
      setDrawingShape({ type: activeTool, x1: x, y1: y, x2: x, y2: y })
    } else if (activeTool === 'freehand') {
      // Vapaapiirtoon kerätään pisteitä taulukkoon
      setDrawingShape({ type: 'freehand', points: [x, y] })
    }
  }

  // Päivittää kesken olevan piirron loppupisteen tai lisää pisteen vapaapiirtoon
  function handleMouseMove() {
    if (!drawingArrow && !drawingShape) return
    const { x, y } = getPointerLogical()
    if (drawingArrow) {
      setDrawingArrow((prev) => ({ ...prev, x2: x, y2: y }))
    } else if (drawingShape?.type === 'freehand') {
      // Vapaapiirto: lisätään jokainen hiiripiste taulukkoon
      setDrawingShape((prev) => ({ ...prev, points: [...prev.points, x, y] }))
    } else {
      setDrawingShape((prev) => ({ ...prev, x2: x, y2: y }))
    }
  }

  // Tallentaa valmiin nuolen tai muodon elementtilistaan hiiren nostossa
  function handleMouseUp() {
    if (drawingArrow) {
      const dx = drawingArrow.x2 - drawingArrow.x1
      const dy = drawingArrow.y2 - drawingArrow.y1
      // Vähintään 15 yksikön matka vaaditaan – vältetään tahattomia pisteitä
      if (Math.sqrt(dx * dx + dy * dy) > 15) {
        onChange([...elements, {
          id: crypto.randomUUID(), type: 'arrow',
          x1: drawingArrow.x1, y1: drawingArrow.y1,
          x2: drawingArrow.x2, y2: drawingArrow.y2,
          arrowType: toolOptions?.arrowType ?? 'syotto',
        }])
      }
      setDrawingArrow(null)
      return
    }
    if (!drawingShape) return
    const color = toolOptions?.drawColor ?? 'white'
    const id = crypto.randomUUID()
    if (drawingShape.type === 'line') {
      const dx = drawingShape.x2 - drawingShape.x1
      const dy = drawingShape.y2 - drawingShape.y1
      // Vähintään 5 yksikön pituus vaaditaan
      if (Math.sqrt(dx * dx + dy * dy) > 5)
        onChange([...elements, { id, type: 'line', x1: drawingShape.x1, y1: drawingShape.y1, x2: drawingShape.x2, y2: drawingShape.y2, color }])
    } else if (drawingShape.type === 'circle') {
      const dx = drawingShape.x2 - drawingShape.x1
      const dy = drawingShape.y2 - drawingShape.y1
      // Säde lasketaan alku- ja loppupisteen etäisyydestä
      const radius = Math.sqrt(dx * dx + dy * dy)
      if (radius > 5)
        onChange([...elements, { id, type: 'circle', x: drawingShape.x1, y: drawingShape.y1, radius, color }])
    } else if (drawingShape.type === 'freehand') {
      // Vähintään 3 pistettä (6 koordinaattia) vaaditaan
      if (drawingShape.points.length >= 6)
        onChange([...elements, { id, type: 'freehand', points: drawingShape.points, color }])
    }
    setDrawingShape(null)
  }

  // Päivittää elementin x/y-koordinaatit vetämisen jälkeen loogisiin koordinaatteihin
  const handleDragEnd = useCallback((e, id) => {
    const node = e.target
    onChange(elements.map((el) =>
      el.id === id ? { ...el, x: node.x() / scale, y: node.y() / scale } : el
    ))
  }, [elements, onChange, scale])

  // Tallentaa rotaation ja skaalauksen Transformer-muokkauksen jälkeen
  const handleTransformEnd = useCallback((e, id) => {
    const node = e.target
    onChange(elements.map((el) =>
      el.id === id
        ? { ...el, rotation: node.rotation(), scaleX: node.scaleX(), scaleY: node.scaleY() }
        : el
    ))
  }, [elements, onChange])

  // Pyörittää elementtiä hiiren rullalla — 15° per askel
  const handleWheel = useCallback((e, id) => {
    e.evt.preventDefault()
    const delta = e.evt.deltaY > 0 ? 5 : -5
    onChange(elements.map((el) =>
      el.id === id ? { ...el, rotation: ((el.rotation ?? 0) + delta + 360) % 360 } : el
    ))
  }, [elements, onChange])

  // Siirtää nuolen (tai viivan) molempia päätepisteitä yhtä paljon – nollaa Group-position siirron jälkeen
  const handleArrowDragEnd = useCallback((e, id) => {
    const dx = e.target.x() / scale
    const dy = e.target.y() / scale
    onChange(elements.map((el) =>
      el.id === id
        ? { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy }
        : el
    ))
    // Nollataan sijainti, jotta koordinaatit pysyvät loogisissa arvoissa
    e.target.position({ x: 0, y: 0 })
  }, [elements, onChange, scale])

  // Asettaa elementin valituksi valinta-tilassa tai polunmuokkaukseen animaatiotilassa
  function selectEl(e, id) {
    if (activeTool === 'animate') {
      e.cancelBubble = true
      // Vain pelaaja, valmentaja ja pallo voivat saada animaatiopolun
      const el = elements.find((el) => el.id === id)
      if (el && ['player', 'coach', 'ball'].includes(el.type)) {
        setAnimSelectedId(id)
      }
      return
    }
    if (activeTool !== 'select') return
    e.cancelBubble = true
    setSelectedId(id)
  }

  // Tallentaa muokatun tekstin elementtilistaan – tyhjä teksti korvataan oletusarvolla
  function commitTextEdit(newText) {
    if (!editingText) return
    onChange(elements.map((el) =>
      el.id === editingText.id ? { ...el, text: newText || 'Teksti' } : el
    ))
    setEditingText(null)
  }

  // Valinta-tilassa normaalikursori, piirtotyökaluissa tähtäinkursori, välineillä plus-kursori
  // Animaatiotilassa: tähtäin kun pelaaja valittu (lisätään reittipisteitä), muuten osoitin
  const draggable = activeTool === 'select'
  const cursor = activeTool === 'select' ? 'default'
    : activeTool === 'animate' ? (animSelectedId ? 'crosshair' : 'pointer')
    : ['arrow', 'line', 'circle', 'freehand'].includes(activeTool) ? 'crosshair'
    : 'cell'

  // animActive vain animaatiotilassa — estää elementtien siirtymisen normaalissa muokkauksessa
  const animActive = activeTool === 'animate' && (isPlaying || animProgress > 0)

  return (
    <div ref={containerRef} className={styles.wrapper}>
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        style={{ cursor, display: 'block' }}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {/* Kenttätausta (nurmikuvio, viivat) */}
          <FieldBackground fieldType={fieldType} scale={scale} />

          {/* Animaatiopolkujen visualisointi – näytetään animaatiotilassa tai toiston aikana */}
          {(activeTool === 'animate' || animActive) &&
            elements.filter((el) => el.animPath?.length > 0).map((el) => {
              const isSelected = el.id === animSelectedId
              const fullPath = [{ x: el.x, y: el.y }, ...el.animPath]
              return (
                <Group key={`anim_path_${el.id}`} listening={false}>
                  {/* Katkoviiva polun varrella */}
                  <Line
                    points={fullPath.flatMap((p) => [p.x * scale, p.y * scale])}
                    stroke={isSelected ? '#1D9E75' : 'rgba(255,255,255,0.3)'}
                    strokeWidth={2 * scale}
                    dash={[6 * scale, 4 * scale]}
                  />
                  {/* Reittipistepisteet (hypätään yli aloituspisteestä) */}
                  {el.animPath.map((wp, i) => (
                    <Circle
                      key={i}
                      x={wp.x * scale} y={wp.y * scale}
                      radius={5 * scale}
                      fill={isSelected ? '#1D9E75' : 'rgba(255,255,255,0.45)'}
                      stroke="white" strokeWidth={scale}
                    />
                  ))}
                </Group>
              )
            })
          }

          {/* Piirretään jokainen elementti sen tyypin mukaan */}
          {elements.map((el) => {
            // --- PELAAJA ---
            if (el.type === 'player') {
              const aPos = animActive ? getAnimatedPos(el, animProgressRef.current) : null
              const ROLE_COLORS = {
                gk: '#f59e0b', blue: '#2563eb', red: '#dc2626', green: '#16a34a', dark: '#374151',
                home: '#2563eb', away: '#dc2626',
              }
              const color = ROLE_COLORS[el.team] ?? '#2563eb'
              const isDef = el.shape === 'def'
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={aPos ? aPos.x * scale : el.x * scale}
                  y={aPos ? aPos.y * scale : el.y * scale}
                  rotation={el.rotation ?? 0}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                >
                  {isDef ? (
                    /* Puolustaja: kolmio + kaari yhtenä yhtenäisenä muotona */
                    <>
                      <Shape
                        sceneFunc={(ctx, shape) => {
                          // Vasemmasta kulmasta kärjen kautta oikeaan kulmaan,
                          // sitten kaari oikeasta kulmasta myötäpäivään alas ja ympäri vasempaan
                          ctx.beginPath()
                          ctx.moveTo(-10 * scale, -5 * scale)
                          ctx.lineTo(0, 10 * scale)
                          ctx.lineTo(10 * scale, -5 * scale)
                          ctx.arc(0, 4 * scale, Math.sqrt(181) * scale,
                            Math.atan2(-9, 10), Math.atan2(-9, -10), false)
                          ctx.closePath()
                          ctx.fillStrokeShape(shape)
                        }}
                        fill={color} stroke="white" strokeWidth={1.5 * scale}
                      />
                    </>
                  ) : (
                    /* Hyökkääjä / MV: ympyrä + pidemmät käsikaaret */
                    <>
                      {/* Paksu valkoinen kaari käsille */}
                      <Shape
                        sceneFunc={(ctx, shape) => {
                          ctx.beginPath()
                          ctx.arc(0, 3 * scale, 15 * scale, Math.PI * 1.05, Math.PI * 1.95, false)
                          ctx.strokeShape(shape)
                        }}
                        stroke="white" strokeWidth={5 * scale} lineCap="round"
                      />
                      {/* Valkoinen ympyrä — ääriviivaksi */}
                      <Circle radius={11.5 * scale} fill="white" />
                      {/* Värillinen kaari käsille */}
                      <Shape
                        sceneFunc={(ctx, shape) => {
                          ctx.beginPath()
                          ctx.arc(0, 3 * scale, 15 * scale, Math.PI * 1.05, Math.PI * 1.95, false)
                          ctx.strokeShape(shape)
                        }}
                        stroke={color} strokeWidth={2.5 * scale} lineCap="round"
                      />
                      {/* Värillinen ympyrä */}
                      <Circle radius={10 * scale} fill={color} />
                    </>
                  )}
                  {/* Numero */}
                  <KonvaText
                    x={-7 * scale} y={isDef ? -3 * scale : -6 * scale}
                    text={String(el.number)}
                    fontSize={10 * scale} fill="white" fontStyle="bold"
                    width={14 * scale} height={12 * scale}
                    align="center" verticalAlign="middle"
                    listening={false}
                  />
                </Group>
              )
            }

            // --- VALMENTAJA ---
            if (el.type === 'coach') {
              const aPos = animActive ? getAnimatedPos(el, animProgressRef.current) : null
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={aPos ? aPos.x * scale : el.x * scale}
                  y={aPos ? aPos.y * scale : el.y * scale}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                >
                  {/* Harmaa neliö valmentajaa kuvaamaan */}
                  <Rect
                    x={-16 * scale} y={-16 * scale}
                    width={32 * scale} height={32 * scale}
                    fill="#475569" stroke="white" strokeWidth={1.5 * scale}
                    cornerRadius={4 * scale}
                  />
                  <KonvaText
                    text="V"
                    fontSize={14 * scale} fill="white" fontStyle="bold"
                    align="center" verticalAlign="middle"
                    width={32 * scale} height={32 * scale}
                    offsetX={16 * scale} offsetY={16 * scale}
                    listening={false}
                  />
                </Group>
              )
            }

            // --- PALLO ---
            if (el.type === 'ball') {
              const s = scale
              const r = 13 * s
              const aPos = animActive ? getAnimatedPos(el, animProgressRef.current) : null
              // 5 mustan viisikulmion kulmat (klassinen jalkapallokuvio)
              const patches = [0, 72, 144, 216, 288].map((deg) => {
                const rad = (deg - 90) * (Math.PI / 180)
                return { x: Math.cos(rad) * 7 * s, y: Math.sin(rad) * 7 * s, rot: deg }
              })
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={aPos ? aPos.x * s : el.x * s}
                  y={aPos ? aPos.y * s : el.y * s}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                >
                  {/* Valkoinen pallo */}
                  <Circle radius={r} fill="white" stroke="#374151" strokeWidth={1.5 * s} />
                  {/* Keskellä musta kuusikulmio */}
                  <RegularPolygon
                    sides={6} radius={4 * s} fill="#1e293b"
                    rotation={30} listening={false}
                  />
                  {/* 5 mustaa viisilkulmiota ympärillä */}
                  {patches.map((p, i) => (
                    <RegularPolygon
                      key={i}
                      x={p.x} y={p.y}
                      sides={5} radius={3.2 * s}
                      fill="#1e293b" rotation={p.rot}
                      listening={false}
                    />
                  ))}
                </Group>
              )
            }

            // --- TÖTSÄ ---
            if (el.type === 'cone') {
              const colors = CONE_HEX[el.color ?? 'orange'] ?? CONE_HEX.orange
              return (
                <RegularPolygon
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  sides={3} radius={14 * scale}
                  fill={colors.fill} stroke={colors.stroke} strokeWidth={1 * scale}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                />
              )
            }

            // --- KEPPI ---
            if (el.type === 'pole') {
              const poleColors = CONE_HEX[el.color ?? 'yellow'] ?? CONE_HEX.yellow
              return (
                <Rect
                  key={el.id} id={`el_${el.id}`}
                  x={(el.x - 2.5) * scale} y={(el.y - 18) * scale}
                  width={5 * scale} height={36 * scale}
                  fill={poleColors.fill} stroke={poleColors.stroke} strokeWidth={0.5 * scale}
                  cornerRadius={2 * scale}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => {
                    const node = e.target
                    // Oikaistaan Rectin vasemman yläkulman offset takaisin loogisiin koordinaatteihin
                    onChange(elements.map((elem) =>
                      elem.id === el.id
                        ? { ...elem, x: (node.x() + 2.5 * scale) / scale, y: (node.y() + 18 * scale) / scale }
                        : elem
                    ))
                  }}
                />
              )
            }

            // --- PIENI MAALI ---
            if (el.type === 'smallgoal') {
              const w = 60, d = 24, bar = 4
              const iw = w - 2 * bar  // sisäleveys
              const id = d - bar      // sisäsyvyys
              const netStep = 10
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  rotation={el.rotation ?? 0}
                  scaleX={el.scaleX ?? 1} scaleY={el.scaleY ?? 1}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                >
                  {/* Verkon täyttö */}
                  <Rect x={(-w/2+bar)*scale} y={(-d/2+bar)*scale} width={iw*scale} height={id*scale} fill="rgba(255,255,255,0.10)" />
                  {/* Verkon pystyviivat */}
                  {Array.from({ length: Math.floor(iw / netStep) - 1 }, (_, i) => (
                    <Line key={`v${i}`}
                      points={[(-w/2+bar+netStep*(i+1))*scale, (-d/2+bar)*scale, (-w/2+bar+netStep*(i+1))*scale, (d/2)*scale]}
                      stroke="rgba(255,255,255,0.3)" strokeWidth={0.6*scale} />
                  ))}
                  {/* Verkon vaakaviivat */}
                  {Array.from({ length: Math.floor(id / netStep) }, (_, i) => (
                    <Line key={`h${i}`}
                      points={[(-w/2+bar)*scale, (-d/2+bar+netStep*(i+1))*scale, (w/2-bar)*scale, (-d/2+bar+netStep*(i+1))*scale]}
                      stroke="rgba(255,255,255,0.3)" strokeWidth={0.6*scale} />
                  ))}
                  {/* Tolpat ja poikkitanko */}
                  <Rect x={(-w/2)*scale} y={(-d/2)*scale} width={w*scale} height={bar*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(-w/2)*scale} y={(-d/2)*scale} width={bar*scale} height={d*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(w/2-bar)*scale} y={(-d/2)*scale} width={bar*scale} height={d*scale} fill="white" cornerRadius={scale} />
                </Group>
              )
            }

            // --- MAALI ---
            if (el.type === 'goal') {
              const w = 110, d = 36, bar = 5
              const iw = w - 2 * bar
              const id = d - bar
              const netStepX = 14, netStepY = 12
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  rotation={el.rotation ?? 0}
                  scaleX={el.scaleX ?? 1} scaleY={el.scaleY ?? 1}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                >
                  {/* Verkon täyttö */}
                  <Rect x={(-w/2+bar)*scale} y={(-d/2+bar)*scale} width={iw*scale} height={id*scale} fill="rgba(255,255,255,0.10)" />
                  {/* Verkon pystyviivat */}
                  {Array.from({ length: Math.floor(iw / netStepX) - 1 }, (_, i) => (
                    <Line key={`v${i}`}
                      points={[(-w/2+bar+netStepX*(i+1))*scale, (-d/2+bar)*scale, (-w/2+bar+netStepX*(i+1))*scale, (d/2)*scale]}
                      stroke="rgba(255,255,255,0.3)" strokeWidth={0.7*scale} />
                  ))}
                  {/* Verkon vaakaviivat */}
                  {Array.from({ length: Math.floor(id / netStepY) }, (_, i) => (
                    <Line key={`h${i}`}
                      points={[(-w/2+bar)*scale, (-d/2+bar+netStepY*(i+1))*scale, (w/2-bar)*scale, (-d/2+bar+netStepY*(i+1))*scale]}
                      stroke="rgba(255,255,255,0.3)" strokeWidth={0.7*scale} />
                  ))}
                  {/* Tolpat ja poikkitanko */}
                  <Rect x={(-w/2)*scale} y={(-d/2)*scale} width={w*scale} height={bar*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(-w/2)*scale} y={(-d/2)*scale} width={bar*scale} height={d*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(w/2-bar)*scale} y={(-d/2)*scale} width={bar*scale} height={d*scale} fill="white" cornerRadius={scale} />
                </Group>
              )
            }

            // --- TIKKAAT ---
            if (el.type === 'ladder') {
              const w = 32, h = 110, rail = 4, rung = 3
              const rungs = [-40, -20, 0, 20, 40] // poikkitankojen y-offsetit
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  rotation={el.rotation ?? 0}
                  scaleX={el.scaleX ?? 1} scaleY={el.scaleY ?? 1}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                >
                  {/* Vasemman ja oikean kaiteen pitkät palkit */}
                  <Rect x={(-w/2)*scale} y={(-h/2)*scale} width={rail*scale} height={h*scale} fill="#fbbf24" cornerRadius={scale} />
                  <Rect x={(w/2-rail)*scale} y={(-h/2)*scale} width={rail*scale} height={h*scale} fill="#fbbf24" cornerRadius={scale} />
                  {/* Vaakasuorat poikkitangot */}
                  {rungs.map((ry, i) => (
                    <Rect key={i} x={(-w/2+rail)*scale} y={(ry-rung/2)*scale} width={(w-rail*2)*scale} height={rung*scale} fill="#fbbf24" />
                  ))}
                </Group>
              )
            }

            // --- AITA ---
            if (el.type === 'hurdle') {
              const w = 70, barY = -8, legH = 20, footW = 14
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  rotation={el.rotation ?? 0}
                  scaleX={el.scaleX ?? 1} scaleY={el.scaleY ?? 1}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                  onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                  onWheel={(e) => handleWheel(e, el.id)}
                >
                  {/* Yläpalkki, vasen jalka, oikea jalka, vasemman jalan jalusta, oikean jalan jalusta */}
                  <Rect x={(-w/2)*scale} y={barY*scale} width={w*scale} height={4*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(-w/2)*scale} y={barY*scale} width={4*scale} height={legH*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(w/2-4)*scale} y={barY*scale} width={4*scale} height={legH*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(-w/2-4)*scale} y={(barY+legH-3)*scale} width={footW*scale} height={4*scale} fill="white" cornerRadius={scale} />
                  <Rect x={(w/2-footW+4)*scale} y={(barY+legH-3)*scale} width={footW*scale} height={4*scale} fill="white" cornerRadius={scale} />
                </Group>
              )
            }

            // --- VIIVA ---
            if (el.type === 'line') {
              const väri = DRAW_HEX[el.color ?? 'white'] ?? '#f1f5f9'
              return (
                <Group key={el.id} id={`el_${el.id}`} draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleArrowDragEnd(e, el.id)}
                >
                  {/* Näkyvä viiva */}
                  <Line points={[el.x1*scale, el.y1*scale, el.x2*scale, el.y2*scale]}
                    stroke={väri} strokeWidth={2.5*scale} lineCap="round" listening={false} />
                  {/* Näkymätön leveämpi viiva – helpottaa viivan valitsemista */}
                  <Line points={[el.x1*scale, el.y1*scale, el.x2*scale, el.y2*scale]}
                    stroke="transparent" strokeWidth={20*scale} hitStrokeWidth={20*scale} />
                </Group>
              )
            }

            // --- YMPYRÄ ---
            if (el.type === 'circle') {
              const väri = DRAW_HEX[el.color ?? 'white'] ?? '#f1f5f9'
              return (
                <Circle key={el.id} id={`el_${el.id}`}
                  x={el.x*scale} y={el.y*scale} radius={el.radius*scale}
                  stroke={väri} strokeWidth={2.5*scale} fill="transparent"
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                />
              )
            }

            // --- VAPAAPIIRTO ---
            if (el.type === 'freehand') {
              const väri = DRAW_HEX[el.color ?? 'white'] ?? '#f1f5f9'
              // Skaalataan kaikki pisteet kerralla ennen renderöintiä
              const skaalatuPisteet = el.points.map((v) => v * scale)
              return (
                <Group key={el.id} id={`el_${el.id}`} draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => {
                    const dx = e.target.x() / scale
                    const dy = e.target.y() / scale
                    // Siirretään jokaista pistettä: parilliset indeksit = x, parittomat = y
                    onChange(elements.map((elem) =>
                      elem.id === el.id
                        ? { ...elem, points: elem.points.map((v, i) => i % 2 === 0 ? v + dx : v + dy) }
                        : elem
                    ))
                    e.target.position({ x: 0, y: 0 })
                  }}
                >
                  {/* Näkyvä vapaapiirtokäyrä */}
                  <Line points={skaalatuPisteet} stroke={väri} strokeWidth={2.5*scale}
                    lineCap="round" lineJoin="round" tension={0.4} listening={false} />
                  {/* Leveämpi näkymätön alue – helpottaa valitsemista */}
                  <Line points={skaalatuPisteet} stroke="transparent"
                    strokeWidth={20*scale} hitStrokeWidth={20*scale} tension={0.4} />
                </Group>
              )
            }

            // --- NUOLI ---
            if (el.type === 'arrow') {
              const arrowType = el.arrowType ?? 'syotto'
              const st = getArrowStyle(arrowType, scale)
              // Kuljetusnuoli käyttää aaltoviivapisteitä, muut suoraa kahden pisteen viivaa
              const pts = arrowType === 'kuljetus'
                ? getKuljetusPoints(el.x1, el.y1, el.x2, el.y2, scale)
                : [el.x1 * scale, el.y1 * scale, el.x2 * scale, el.y2 * scale]
              return (
                <Group
                  key={el.id} id={`el_${el.id}`}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  onDragEnd={(e) => handleArrowDragEnd(e, el.id)}
                >
                  <Arrow
                    points={pts}
                    stroke={st.stroke} fill={st.fill}
                    strokeWidth={st.strokeWidth}
                    dash={arrowType === 'kuljetus' ? [6 * scale, 4 * scale] : (st.dash ?? undefined)}
                    pointerLength={st.pLen} pointerWidth={st.pWidth}
                    listening={false}
                  />
                  {/* Leveämpi näkymätön viiva nuolen valitsemisen helpottamiseksi */}
                  <Line
                    points={[el.x1 * scale, el.y1 * scale, el.x2 * scale, el.y2 * scale]}
                    stroke="transparent" strokeWidth={20 * scale} hitStrokeWidth={20 * scale}
                  />
                </Group>
              )
            }

            // --- TEKSTI ---
            if (el.type === 'text') {
              return (
                <KonvaText
                  key={el.id} id={`el_${el.id}`}
                  x={el.x * scale} y={el.y * scale}
                  text={el.text} fontSize={15 * scale}
                  fill="white" fontStyle="bold"
                  shadowColor="black" shadowBlur={4} shadowOpacity={0.8}
                  draggable={draggable}
                  onClick={(e) => selectEl(e, el.id)}
                  // Kaksoisklikkaus tai -napautus avaa tekstieditorin
                  onDblClick={() => setEditingText({ id: el.id, x: el.x * scale, y: el.y * scale, text: el.text })}
                  onDblTap={() => setEditingText({ id: el.id, x: el.x * scale, y: el.y * scale, text: el.text })}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                />
              )
            }

            return null
          })}

          {/* Piirtoesikatselut – näytetään piirtämisen aikana ennen tallennusta */}
          {drawingArrow && (
            <Arrow
              points={[drawingArrow.x1*scale, drawingArrow.y1*scale, drawingArrow.x2*scale, drawingArrow.y2*scale]}
              stroke="rgba(255,255,255,0.55)" strokeWidth={2.5*scale} fill="rgba(255,255,255,0.55)"
              pointerLength={10*scale} pointerWidth={8*scale}
              dash={[6*scale, 4*scale]} listening={false}
            />
          )}
          {drawingShape?.type === 'line' && (
            <Line
              points={[drawingShape.x1*scale, drawingShape.y1*scale, drawingShape.x2*scale, drawingShape.y2*scale]}
              stroke="rgba(255,255,255,0.55)" strokeWidth={2.5*scale} lineCap="round" listening={false}
            />
          )}
          {drawingShape?.type === 'circle' && (() => {
            const dx = drawingShape.x2 - drawingShape.x1
            const dy = drawingShape.y2 - drawingShape.y1
            return (
              <Circle
                x={drawingShape.x1*scale} y={drawingShape.y1*scale}
                radius={Math.sqrt(dx*dx + dy*dy) * scale}
                stroke="rgba(255,255,255,0.55)" strokeWidth={2.5*scale} fill="transparent" listening={false}
              />
            )
          })()}
          {drawingShape?.type === 'freehand' && drawingShape.points.length >= 4 && (
            <Line
              points={drawingShape.points.map((v) => v * scale)}
              stroke="rgba(255,255,255,0.55)" strokeWidth={2.5*scale}
              lineCap="round" lineJoin="round" tension={0.4} listening={false}
            />
          )}

          {/* Transformer – näyttää kahvat ja sallii kierron ja skaalauksen valitulle elementille */}
          <Transformer
            ref={trRef} rotateEnabled={true}
            borderStroke="#3b82f6" borderStrokeWidth={1.5}
            anchorFill="#3b82f6" anchorStroke="#1d4ed8" anchorSize={8}
            // Estetään elementtiä kutistumasta liian pieneksi
            boundBoxFunc={(oldBox, newBox) => newBox.width < 10 || newBox.height < 10 ? oldBox : newBox}
          />
        </Layer>
      </Stage>

      {/* ── ANIMAATIOKONTROLLIT – näytetään animaatiotilassa ── */}
      {activeTool === 'animate' && (
        <div className={styles.animControls}>
          {/* Toistopainikkeet */}
          <div className={styles.animBtns}>
            <button className={styles.animBtn} onClick={resetAnim} title="Alusta">⏮</button>
            <button
              className={`${styles.animBtn} ${styles.animBtnPlay}`}
              onClick={isPlaying ? pauseAnim : playAnim}
              title={isPlaying ? 'Tauko' : 'Toista'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>

          {/* Aikajanaliukuri */}
          <div className={styles.animScrubberWrap}>
            <div className={styles.animProgressFill} style={{ width: `${animProgress * 100}%` }} />
            <input
              type="range" min={0} max={1} step={0.001}
              value={animProgress}
              onChange={(e) => {
                const p = parseFloat(e.target.value)
                pauseAnim()
                animProgressRef.current = p
                // Päivitä nodet heti skrubbauksen yhteydessä
                if (stageRef.current) {
                  elements.forEach((el) => {
                    if (!['player', 'coach', 'ball'].includes(el.type)) return
                    const aPos = getAnimatedPos(el, p)
                    if (!aPos) return
                    const node = stageRef.current.findOne(`#el_${el.id}`)
                    if (node) { node.x(aPos.x * scale); node.y(aPos.y * scale) }
                  })
                  stageRef.current.getLayers()[0]?.batchDraw()
                }
              }}
              className={styles.animScrubber}
            />
          </div>

          {/* Ohjeteksti polun muokkaukseen */}
          <div className={styles.animHint}>
            {animSelectedId
              ? <>
                  Klikkaa kentällä lisätäksesi reittipiste &nbsp;·&nbsp;
                  <button
                    className={styles.animClearBtn}
                    onClick={() => onChange(elements.map((el) =>
                      el.id === animSelectedId ? { ...el, animPath: [] } : el
                    ))}
                  >
                    Tyhjennä polku
                  </button>
                </>
              : 'Klikkaa pelaajaa, valmentajaa tai palloa muokataksesi polkua'
            }
          </div>
        </div>
      )}

      {/* Poista-nappi – näytetään valitun elementin Transformerin oikeassa yläkulmassa */}
      {deleteBtnPos && selectedId && activeTool === 'select' && (
        <button
          className={styles.deleteBtn}
          style={{ left: deleteBtnPos.x, top: deleteBtnPos.y }}
          onMouseDown={(e) => { e.stopPropagation(); deleteSelected() }}
          title="Poista"
        >×</button>
      )}

      {/* Tekstieditori – HTML textarea Konva-elementin päällä, sijoitettu absoluuttisesti */}
      {editingText && (
        <textarea
          className={styles.textEditor}
          style={{ left: editingText.x, top: editingText.y }}
          defaultValue={editingText.text}
          autoFocus
          onFocus={(e) => e.target.select()} // Valitaan koko teksti heti kun editori aukeaa
          onBlur={(e) => commitTextEdit(e.target.value.trim())}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) e.target.blur() // Enter tallentaa (ilman Shift)
            if (e.key === 'Escape') setEditingText(null)           // Escape peruuttaa muokkauksen
          }}
        />
      )}
    </div>
  )
})

export default DrillCanvas
