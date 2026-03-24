// useAnimationEngine — animaatiologiikka DrillCanvasille
// Eristää RAF-silmukan, toiston tilan ja Konva-noden päivityksen omaan hookkiin

import { useState, useRef, useEffect } from 'react'

const ANIM_DURATION = 5000 // toiston kesto millisekunteina

// Laske elementin animoitu sijainti annetulla progress-arvolla (0–1)
// Palauttaa null jos elementillä ei ole polkua
export function getAnimatedPos(el, progress) {
  if (!el.animPath || el.animPath.length === 0) return null
  // Polku alkaa elementin nykyisestä sijainnista
  const path = [{ x: el.x, y: el.y }, ...el.animPath]
  const numSegments = path.length - 1
  if (numSegments === 0) return { x: el.x, y: el.y }
  // Lasketaan missä segmentissä ollaan
  const total = progress * numSegments
  const segIdx = Math.min(Math.floor(total), numSegments - 1)
  const segT = total - segIdx
  const start = path[segIdx]
  const end = path[segIdx + 1]
  return {
    x: start.x + segT * (end.x - start.x),
    y: start.y + segT * (end.y - start.y),
  }
}

// stageRef = Konva Stage -viite, elements = kenttäelementit, scale = skaalauskerroin
export function useAnimationEngine({ stageRef, elements, scale }) {
  // animSelectedId = pelaaja jonka polkua muokataan animaatiotilassa
  const [animSelectedId, setAnimSelectedId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  // animProgress STATE = vain skrubberia varten (päivitetään ~4fps)
  // animProgressRef = toiston todellinen arvo — ei aiheuta re-renderöintiä
  const [animProgress, setAnimProgress] = useState(0)
  const animProgressRef = useRef(0)
  const animFrameRef = useRef(null)
  const animStartTimeRef = useRef(null)
  const lastScrubberUpdateRef = useRef(0)
  // Globaali abort-lippu — estää vanhan RAF-silmukan jatkumisen kun uusi käynnistetään
  // (pelkkä closure-cancelled ei riitä: React voi batching-mekanismilla ohittaa cleanupn)
  const animActiveRef = useRef(false)

  // RAF-toistosikklukka — Konva-nodet päivitetään suoraan, ei React re-renderöintiä per frame
  useEffect(() => {
    if (!isPlaying) {
      animActiveRef.current = false
      return
    }
    animActiveRef.current = true

    function frame(now) {
      if (!animActiveRef.current) return
      const elapsed = now - animStartTimeRef.current
      const progress = Math.min(elapsed / ANIM_DURATION, 1)
      animProgressRef.current = progress

      // Päivitä Konva-nodet suoraan ilman React re-renderöintiä (60fps)
      if (stageRef.current) {
        elements.forEach((el) => {
          if (!['player', 'coach', 'ball'].includes(el.type)) return
          const aPos = getAnimatedPos(el, progress)
          if (!aPos) return
          const node = stageRef.current.findOne(`#el_${el.id}`)
          if (node) { node.x(aPos.x * scale); node.y(aPos.y * scale) }
        })
        stageRef.current.getLayers()[0]?.batchDraw()
      }

      // Päivitä skrubberin state vain ~4fps (250ms välein)
      if (now - lastScrubberUpdateRef.current > 250) {
        setAnimProgress(progress)
        lastScrubberUpdateRef.current = now
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(frame)
      } else {
        animActiveRef.current = false
        setAnimProgress(1)
        setIsPlaying(false)
      }
    }

    animFrameRef.current = requestAnimationFrame(frame)
    return () => {
      animActiveRef.current = false
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // Aloita toisto — aseta globaali lippu ENNEN setIsPlaying jotta RAF lähtee puhtaasti
  function playAnim() {
    animActiveRef.current = false
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    animStartTimeRef.current = performance.now() - animProgressRef.current * ANIM_DURATION
    setIsPlaying(true)
  }

  // Pysäytä toisto — säilyttää nykyisen sijainnin
  function pauseAnim() {
    animActiveRef.current = false
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    setAnimProgress(animProgressRef.current)
    setIsPlaying(false)
  }

  // Palauta alkuun — nollaa progress ja pysäyttää toiston
  function resetAnim() {
    animActiveRef.current = false
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    animProgressRef.current = 0
    setAnimProgress(0)
    setIsPlaying(false)
    // Palauta pelaajat alkusijainteihin suoraan Konvaan
    if (stageRef.current) {
      elements.forEach((el) => {
        if (!['player', 'coach', 'ball'].includes(el.type)) return
        const node = stageRef.current.findOne(`#el_${el.id}`)
        if (node) { node.x(el.x * scale); node.y(el.y * scale) }
      })
      stageRef.current.getLayers()[0]?.batchDraw()
    }
  }

  // Palauta tila alkutilaan kun animaatiotyökalusta poistutaan
  function resetAll() {
    setAnimSelectedId(null)
    animActiveRef.current = false
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    setIsPlaying(false)
    setAnimProgress(0)
    animProgressRef.current = 0
  }

  return {
    animSelectedId,
    setAnimSelectedId,
    isPlaying,
    animProgress,
    animProgressRef,
    animActiveRef,
    playAnim,
    pauseAnim,
    resetAnim,
    resetAll,
    ANIM_DURATION,
  }
}
