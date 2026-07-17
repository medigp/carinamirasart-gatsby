import React, { useEffect, useMemo, useRef, useState } from "react"
import styled from "styled-components"

const EFFECT_PRESETS = {
  scratch: {
    aliasOf: "cakeCut",
  },
  cakeCut: {
    coverColor: "#edece6", // Color de la capa superior.
    brushMin: 16, // Amplada minima del ganivet.
    brushMax: 28, // Amplada maxima del ganivet.
    intensity: 0.9, // Mes alt revela mes fons.
    healDelay: 14000, // Temps abans que comenci a curar-se.
    healDuration: 8000, // Durada del tancament suau.
    maxMarks: 190,
    bristles: 0,
    edgeChips: 0,
    stepDistance: 9,
    gouge: 1,
    cakeCut: 1,
    scrape: 0,
    tear: 0,
    jitter: 0.25,
    stableWidth: 1,
    moveThrottle: 16,
    ridgeAlpha: 0.26,
  },
  impastoScrape: {
    coverColor: "#edece6", // Color de la capa superior.
    brushMin: 22, // Amplada minima de l'eina.
    brushMax: 38, // Amplada maxima de l'eina.
    intensity: 0.88, // Mes alt revela mes fons.
    healDelay: 14000, // Temps abans que comenci a curar-se.
    healDuration: 8000, // Durada del tancament suau.
    maxMarks: 150,
    bristles: 0,
    edgeChips: 0,
    stepDistance: 7,
    gouge: 1,
    impasto: 1,
    materialScrape: 1,
    scrape: 0,
    tear: 0,
    jitter: 0.4,
    stableWidth: 1,
    moveThrottle: 18,
    ridgeAlpha: 0.22,
  },
  openingImpastoScrape: {
    coverColor: "#edece6",
    brushMin: 18,
    brushMax: 34,
    intensity: 0.86,
    healDelay: 14000,
    healDuration: 8000,
    maxMarks: 190,
    bristles: 0,
    edgeChips: 0,
    stepDistance: 10,
    gouge: 1,
    impasto: 1,
    chiselScrape: 1,
    scrape: 0,
    tear: 0,
    jitter: 0,
    moveThrottle: 16,
    ridgeAlpha: 0.18,
  },
  psychedelicOpen: {
    coverColor: "#edece6",
    brushMin: 22,
    brushMax: 38,
    intensity: 0.88,
    healDelay: 14000,
    healDuration: 8000,
    maxMarks: 150,
    bristles: 0,
    edgeChips: 0,
    stepDistance: 7,
    gouge: 1,
    impasto: 1,
    materialScrape: 1,
    opensFromPoint: 1,
    extremeOpen: 1,
    scrape: 0,
    tear: 0,
    jitter: 0.4,
    stableWidth: 1,
    moveThrottle: 18,
    ridgeAlpha: 0.22,
  },
  markerLine: {
    coverColor: "#edece6",
    brushMin: 12,
    brushMax: 24,
    intensity: 0.9,
    healDelay: 13000,
    healDuration: 7000,
    maxMarks: 220,
    bristles: 0,
    edgeChips: 0,
    stepDistance: 10,
    gouge: 1,
    impasto: 1,
    scrape: 0,
    tear: 0,
    jitter: 0.5,
    stableWidth: 1,
    moveThrottle: 16,
    ridgeAlpha: 0.1,
  },
  cleanScratch: {
    coverColor: "#edece6", // Color de la capa superior.
    brushMin: 7, // Amplada minima del solc.
    brushMax: 14, // Amplada maxima del solc.
    intensity: 0.92, // Mes alt revela mes fons.
    healDelay: 13000, // Temps abans que comenci a curar-se.
    healDuration: 6500, // Durada del tancament suau.
    maxMarks: 240,
    bristles: 0,
    edgeChips: 0,
    stepDistance: 10,
    gouge: 1,
    scrape: 1,
    tear: 0,
    jitter: 0.2,
    ridgeAlpha: 0.09,
  },
  irregularScratch: {
    coverColor: "#edece6",
    brushMin: 10, // Amplada minima de la ferida.
    brushMax: 22, // Amplada maxima de la ferida.
    intensity: 0.96, // Mes alt revela mes fons.
    healDelay: 12000, // Temps abans que comenci a curar-se.
    healDuration: 6500, // Durada del tancament suau.
    maxMarks: 190,
    bristles: 5,
    edgeChips: 7,
    stepDistance: 18,
    gouge: 1,
    tear: 0.35,
    jitter: 8,
    ridgeAlpha: 0.18,
  },
  subtleBrush: {
    coverColor: "#edece6",
    brushMin: 12,
    brushMax: 24,
    intensity: 0.24,
    healDelay: 13000,
    healDuration: 9000,
    maxMarks: 130,
    bristles: 12,
    edgeChips: 4,
    stepDistance: 44,
    gouge: 0.28,
    tear: 0,
    jitter: 5,
    ridgeAlpha: 0.025,
    scrollForce: 0.18,
    scrollInterval: 520,
  },
  softBrush: {
    coverColor: "#edece6",
    brushMin: 16,
    brushMax: 30,
    intensity: 0.34,
    healDelay: 13000,
    healDuration: 9000,
    maxMarks: 150,
    bristles: 13,
    edgeChips: 5,
    stepDistance: 40,
    gouge: 0.3,
    tear: 0,
    jitter: 5,
    ridgeAlpha: 0.035,
    scrollForce: 0.24,
    scrollInterval: 460,
  },
  softBrushStitched: {
    coverColor: "#edece6",
    brushMin: 16,
    brushMax: 28,
    intensity: 0.32,
    healDelay: 13000,
    healDuration: 9000,
    maxMarks: 240,
    bristles: 11,
    edgeChips: 3,
    stepDistance: 16,
    gouge: 0.3,
    tear: 0,
    jitter: 2,
    ridgeAlpha: 0.03,
    continuousBristles: 1,
    stableWidth: 1,
    scrollForce: 0.2,
    scrollInterval: 460,
  },
  continuousSoftBrush: {
    coverColor: "#edece6",
    brushMin: 18,
    brushMax: 28,
    intensity: 0.32,
    healDelay: 13000,
    healDuration: 9000,
    maxMarks: 260,
    bristles: 9,
    edgeChips: 0,
    stepDistance: 8,
    gouge: 0.28,
    tear: 0,
    jitter: 0,
    ridgeAlpha: 0.02,
    continuousStroke: 1,
    stableWidth: 1,
    scrollForce: 0.18,
    scrollInterval: 460,
  },
  continuousBrush: {
    coverColor: "#edece6",
    brushMin: 24,
    brushMax: 38,
    intensity: 0.46,
    healDelay: 13000,
    healDuration: 9000,
    maxMarks: 260,
    bristles: 11,
    edgeChips: 2,
    stepDistance: 8,
    gouge: 0.3,
    tear: 0,
    jitter: 0,
    ridgeAlpha: 0.045,
    continuousStroke: 1,
    stableWidth: 1,
    scrollForce: 0.26,
    scrollInterval: 440,
  },
  strangeBrush: {
    coverColor: "#edece6",
    brushMin: 24,
    brushMax: 50,
    intensity: 0.88,
    healDelay: 11000,
    healDuration: 7000,
    maxMarks: 150,
    bristles: 18,
    edgeChips: 10,
    stepDistance: 30,
    gouge: 0.35,
    tear: 0,
    jitter: 8,
    ridgeAlpha: 0.08,
  },
  softWear: {
    coverColor: "#edece6",
    brushMin: 28,
    brushMax: 76,
    intensity: 0.42,
    healDelay: 9000,
    healDuration: 7000,
    maxMarks: 90,
    bristles: 9,
    edgeChips: 12,
    stepDistance: 38,
    gouge: 0.15,
    tear: 0,
    jitter: 10,
    ridgeAlpha: 0.04,
  },
}

const getPointFromEvent = (event, bounds) => {
  const source = event.touches?.[0] || event.changedTouches?.[0] || event

  if (!source) {
    return null
  }

  const x = source.clientX - bounds.left
  const y = source.clientY - bounds.top

  if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) {
    return null
  }

  return { x, y }
}

const isInteractiveElement = (target) => (
  target?.closest?.("a, button, input, select, textarea, label, [role='button']")
)

const createStrokeBristles = (preset, width) => (
  Array.from({ length: preset.bristles }, (_, index) => {
    const ratio = preset.bristles <= 1 ? 0.5 : index / (preset.bristles - 1)

    return {
      offset: (ratio - 0.5) * width * 0.82 + (Math.random() - 0.5) * width * 0.08,
      lineWidth: width * (0.035 + Math.random() * 0.055),
      alpha: 0.42 + Math.random() * 0.3,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSize: width * (0.025 + Math.random() * 0.035),
    }
  })
)

const makeScratchMark = (from, to, width, now, force, preset, strokeBristles = null, shapeMeta = null) => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.max(1, Math.sqrt(dx * dx + dy * dy))
  const directionX = dx / length
  const directionY = dy / length
  const normalX = -directionY
  const normalY = directionX

  const scrapeLines = preset.scrape ? [
    {
      offset: 0,
      start: 0,
      end: 1,
      lineWidth: width,
      alpha: 0.86,
      wobble: 0,
      straight: true,
    },
    {
      offset: -width * 0.32,
      start: 0.04,
      end: 0.96,
      lineWidth: width * 0.18,
      alpha: 0.38,
      wobble: 0,
      straight: true,
    },
    {
      offset: width * 0.32,
      start: 0.02,
      end: 0.92,
      lineWidth: width * 0.15,
      alpha: 0.3,
      wobble: 0,
      straight: true,
    },
  ] : []

  const impastoLines = preset.impasto && !preset.materialScrape ? [
    {
      offset: 0,
      start: 0,
      end: 1,
      lineWidth: width,
      alpha: 0.82,
      wobble: 0,
      straight: true,
    },
  ] : []

  const continuousBristles = strokeBristles ? strokeBristles.map((bristle) => ({
    offset: bristle.offset,
    start: 0,
    end: 1,
    lineWidth: bristle.lineWidth,
    alpha: bristle.alpha,
    wobble: Math.sin(now / 220 + bristle.wobblePhase) * bristle.wobbleSize,
  })) : []
  const randomBristles = strokeBristles ? [] : Array.from({ length: preset.bristles }, () => ({
    offset: (Math.random() - 0.5) * width * (preset.tear > 0.8 ? 0.28 : preset.gouge > 0.8 ? 0.62 : 1),
    start: preset.continuousBristles ? 0 : Math.random() * (preset.gouge > 0.8 ? 0.06 : 0.18),
    end: preset.continuousBristles ? 1 : (preset.gouge > 0.8 ? 0.92 : 0.78) + Math.random() * (preset.gouge > 0.8 ? 0.08 : 0.22),
    lineWidth: width * (preset.continuousBristles ? 0.035 + Math.random() * 0.065 : preset.tear > 0.8 ? 0.055 + Math.random() * 0.08 : preset.gouge > 0.8 ? 0.08 + Math.random() * 0.16 : 0.025 + Math.random() * 0.11),
    alpha: 0.3 + Math.random() * 0.7,
    wobble: (Math.random() - 0.5) * width * (preset.continuousBristles ? 0.12 : preset.tear > 0.8 ? 0.08 : preset.gouge > 0.8 ? 0.16 : 0.42),
  }))
  const bristles = scrapeLines.concat(impastoLines).concat(continuousBristles).concat(randomBristles)

  const centerGouge = {
    offset: (Math.random() - 0.5) * width * (preset.tear > 0.8 ? 0.08 : 0.16),
    start: 0,
    end: 1,
    lineWidth: width * (preset.tear > 0.8 ? 0.62 + Math.random() * 0.2 : 0.46 + Math.random() * 0.22),
    alpha: preset.tear > 0.8 ? 0.9 : 0.76 + Math.random() * 0.2,
    wobble: (Math.random() - 0.5) * width * (preset.tear > 0.8 ? 0.035 : 0.1),
  }

  if (preset.gouge > 0.8 && !preset.scrape && !preset.materialScrape) {
    bristles.unshift(centerGouge)
  }

  const chips = Array.from({ length: preset.edgeChips }, () => {
    const progress = Math.random()
    const side = Math.random() > 0.5 ? 1 : -1
    const edgeOffset = side * width * (preset.tear > 0.8 ? 0.28 + Math.random() * 0.48 : 0.35 + Math.random() * 0.35)

    return {
      x: from.x + dx * progress + normalX * edgeOffset,
      y: from.y + dy * progress + normalY * edgeOffset,
      rx: width * (preset.tear > 0.8 ? 0.035 + Math.random() * 0.1 : 0.04 + Math.random() * 0.13),
      ry: width * (preset.tear > 0.8 ? 0.012 + Math.random() * 0.055 : 0.018 + Math.random() * 0.07),
      rotation: Math.atan2(dy, dx) + (Math.random() - 0.5) * (preset.tear > 0.8 ? 1.25 : 0.9),
      alpha: preset.tear > 0.8 ? 0.32 + Math.random() * 0.5 : 0.22 + Math.random() * 0.46,
    }
  })

  const skips = []

  const toolMarks = preset.materialScrape ? Array.from({ length: 7 }, (_, index) => {
    const ratio = index / 6
    const offset = (ratio - 0.5) * width * 0.86
    const opening = 1 - Math.abs(ratio - 0.5) * 1.45

    return {
      offset,
      start: Math.random() * 0.08,
      end: 0.86 + Math.random() * 0.14,
      lineWidth: width * (0.08 + Math.max(0.02, opening) * 0.11),
      alpha: 0.22 + Math.max(0, opening) * 0.58,
      wobble: (Math.random() - 0.5) * width * 0.08,
    }
  }) : []

  const dryScratches = preset.materialScrape ? Array.from({ length: 4 }, () => ({
    offset: (Math.random() - 0.5) * width * 0.94,
    start: 0.08 + Math.random() * 0.18,
    end: 0.58 + Math.random() * 0.36,
    lineWidth: width * (0.018 + Math.random() * 0.025),
    alpha: 0.18 + Math.random() * 0.18,
    wobble: (Math.random() - 0.5) * width * 0.12,
  })) : []

  const cakeGroove = preset.cakeCut ? {
    distance: shapeMeta?.cakeDistance || 0,
    center: {
      offsetRatio: 0,
      lineWidthRatio: 0.54,
      alpha: 0.78,
    },
    sideCuts: [-1, 1].map((side) => ({
      offsetRatio: side * 0.34,
      lineWidthRatio: 0.16,
      alpha: 0.3,
    })),
  } : null

  const crumbs = []

  const speedRatio = Math.min(1, length / 32)
  const speedWidth = preset.chiselScrape ? width : width
  const tipWidth = preset.chiselScrape ? Math.max(1.25, width * 0.045) : width
  const chiselLength = preset.chiselScrape ? Math.max(length, width * 1.18) : length
  const shoulderX = to.x - directionX * chiselLength * 0.42
  const shoulderY = to.y - directionY * chiselLength * 0.42
  const tailX = to.x - directionX * chiselLength
  const tailY = to.y - directionY * chiselLength
  const leftNoise = (Math.random() - 0.5) * speedWidth * 0.1
  const rightNoise = (Math.random() - 0.5) * speedWidth * 0.1
  const chiselShape = preset.chiselScrape ? {
    points: [
      { x: to.x + normalX * tipWidth * -0.5, y: to.y + normalY * tipWidth * -0.5 },
      { x: shoulderX + normalX * (speedWidth * -0.5 + leftNoise), y: shoulderY + normalY * (speedWidth * -0.5 + leftNoise) },
      { x: tailX + normalX * speedWidth * -0.26 + directionX * speedWidth * 0.08, y: tailY + normalY * speedWidth * -0.26 + directionY * speedWidth * 0.08 },
      { x: tailX + normalX * speedWidth * 0.3 - directionX * speedWidth * 0.04, y: tailY + normalY * speedWidth * 0.3 - directionY * speedWidth * 0.04 },
      { x: shoulderX + normalX * (speedWidth * 0.48 + rightNoise), y: shoulderY + normalY * (speedWidth * 0.48 + rightNoise) },
      { x: to.x + normalX * tipWidth * 0.5, y: to.y + normalY * tipWidth * 0.5 },
    ],
    alpha: 0.5 + speedRatio * 0.34,
  } : null

  const chiselNoise = preset.chiselScrape ? Array.from({ length: 5 }, () => {
    const progress = Math.random() * 0.78
    const localWidth = tipWidth + (speedWidth - tipWidth) * (1 - progress)
    const offset = (Math.random() - 0.5) * localWidth

    return {
      x: to.x - directionX * chiselLength * progress + normalX * offset,
      y: to.y - directionY * chiselLength * progress + normalY * offset,
      rx: width * (0.018 + Math.random() * 0.04),
      ry: width * (0.01 + Math.random() * 0.025),
      rotation: Math.atan2(dy, dx),
      alpha: 0.12 + Math.random() * 0.12,
    }
  }) : []

  const ridges = [-1, 1].map((side) => ({
    side,
    offset: side * width * (preset.chiselScrape ? 0.24 + Math.random() * 0.08 : preset.cakeCut ? 0.48 + Math.random() * 0.08 : preset.materialScrape ? 0.52 + Math.random() * 0.09 : preset.impasto ? 0.55 : preset.scrape ? 0.58 : preset.tear > 0.8 ? 0.42 + Math.random() * 0.14 : 0.54 + Math.random() * 0.18),
    lineWidth: width * (preset.chiselScrape ? 0.02 + Math.random() * 0.02 : preset.cakeCut ? 0.085 + Math.random() * 0.035 : preset.materialScrape ? 0.045 + Math.random() * 0.035 : preset.impasto ? 0.035 : preset.scrape ? 0.055 : preset.tear > 0.8 ? 0.06 + Math.random() * 0.065 : 0.045 + Math.random() * 0.05),
    alpha: preset.hideRidges ? 0 : preset.ridgeAlpha * (preset.chiselScrape ? 0.35 + Math.random() * 0.28 : 0.7 + Math.random() * 0.45),
    wobble: (Math.random() - 0.5) * width * (preset.chiselScrape ? 0.08 : preset.cakeCut ? 0.04 : preset.materialScrape ? 0.08 : preset.impasto ? 0.02 : preset.scrape ? 0.025 : preset.tear > 0.8 ? 0.08 : 0.18),
    highlight: preset.impasto || preset.materialScrape || preset.cakeCut || preset.chiselScrape,
  }))

  return {
    from,
    to,
    width,
    force,
    createdAt: now,
    bristles,
    chips,
    toolMarks,
    dryScratches,
    cakeGroove,
    crumbs,
    chiselShape,
    chiselNoise,
    skips,
    ridges,
  }
}

const ScratchRevealBackground = ({
  className,
  variant = "openingImpastoScrape",
  maxAgeSeconds = 0,
  maxMarks = 0,
  backgroundImage = false,
  showBackgroundTexture = false,
  strokeScale = 1,
  hideOnScratch = false,
}) => {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const marksRef = useRef([])
  const previousPointRef = useRef(null)
  const strokeStartRef = useRef(null)
  const strokeDistanceRef = useRef(0)
  const strokeWidthRef = useRef(null)
  const chiselWidthRef = useRef(null)
  const strokeBristlesRef = useRef(null)
  const frameRef = useRef(null)
  const lastMoveRef = useRef(0)
  const lastScrollRef = useRef(0)
  const touchGestureRef = useRef(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const selectedPreset = EFFECT_PRESETS[variant] || EFFECT_PRESETS.scratch
  const preset = selectedPreset.aliasOf ? EFFECT_PRESETS[selectedPreset.aliasOf] : selectedPreset
  const presetKey = selectedPreset.aliasOf || variant
  const textureEnabled = typeof showBackgroundTexture === "boolean"
    ? showBackgroundTexture
    : !backgroundImage
  const safeStrokeScale = Number.isFinite(strokeScale) && strokeScale > 0 ? strokeScale : 1
  const scaledPreset = useMemo(() => ({
    ...preset,
    brushMin: preset.brushMin * safeStrokeScale,
    brushMax: preset.brushMax * safeStrokeScale,
  }), [preset, safeStrokeScale])
  const maxAgeMs = Number.isFinite(maxAgeSeconds)
    ? maxAgeSeconds * 1000
    : scaledPreset.healDelay + scaledPreset.healDuration
  const markLimit = Number.isFinite(maxMarks) ? maxMarks : scaledPreset.maxMarks

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateReducedMotion = () => setReducedMotion(mediaQuery.matches)

    updateReducedMotion()

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateReducedMotion)
    } else {
      mediaQuery.addListener(updateReducedMotion)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateReducedMotion)
      } else {
        mediaQuery.removeListener(updateReducedMotion)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || reducedMotion) {
      return undefined
    }

    marksRef.current = []
    previousPointRef.current = null
    strokeWidthRef.current = null
    chiselWidthRef.current = null
    strokeBristlesRef.current = null
    strokeDistanceRef.current = 0

    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    const canvas = canvasRef.current
    const root = rootRef.current

    if (!canvas || !root) {
      return undefined
    }

    const context = canvas.getContext("2d", { alpha: true })
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches
    const textureCanvas = document.createElement("canvas")
    const textureContext = textureCanvas.getContext("2d")
    const staticCanvas = document.createElement("canvas")
    const staticContext = staticCanvas.getContext("2d")
    const useStaticCanvas = maxAgeMs <= 0 && !scaledPreset.cakeCut
    let lastRenderAt = 0

    const copyStaticCanvas = () => {
      const width = canvas.width / pixelRatio
      const height = canvas.height / pixelRatio

      context.save()
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.globalCompositeOperation = "source-over"
      context.clearRect(0, 0, width, height)
      context.drawImage(staticCanvas, 0, 0, width, height)
      context.restore()
    }

    const resetStaticCanvas = () => {
      const width = canvas.width / pixelRatio
      const height = canvas.height / pixelRatio

      staticContext.save()
      staticContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      staticContext.globalCompositeOperation = "source-over"
      staticContext.clearRect(0, 0, width, height)

      if (!hideOnScratch) {
        staticContext.drawImage(textureCanvas, 0, 0, width, height)
      }

      staticContext.restore()
    }

    const paintCover = () => {
      const width = canvas.width / pixelRatio
      const height = canvas.height / pixelRatio

      if (useStaticCanvas) {
        copyStaticCanvas()
        return
      }

      context.save()
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.globalCompositeOperation = "source-over"
      context.clearRect(0, 0, width, height)

      if (!hideOnScratch) {
        context.drawImage(textureCanvas, 0, 0, width, height)
      }

      context.restore()
    }

    const resize = () => {
      const bounds = root.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(bounds.width * pixelRatio))
      canvas.height = Math.max(1, Math.floor(bounds.height * pixelRatio))
      canvas.style.width = `${bounds.width}px`
      canvas.style.height = `${bounds.height}px`

      textureCanvas.width = canvas.width
      textureCanvas.height = canvas.height
      staticCanvas.width = canvas.width
      staticCanvas.height = canvas.height
      textureContext.save()
      textureContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      textureContext.fillStyle = scaledPreset.coverColor
      textureContext.fillRect(0, 0, bounds.width, bounds.height)

      for (let i = 0; i < Math.floor((bounds.width * bounds.height) / 5200); i += 1) {
        const alpha = 0.035 + Math.random() * 0.045
        textureContext.fillStyle = `rgba(70, 66, 55, ${alpha})`
        textureContext.fillRect(Math.random() * bounds.width, Math.random() * bounds.height, 1, 1)
      }

      for (let i = 0; i < Math.floor((bounds.width * bounds.height) / 28000); i += 1) {
        const x = Math.random() * bounds.width
        const y = Math.random() * bounds.height
        const radius = 4 + Math.random() * 18

        textureContext.fillStyle = `rgba(255, 255, 250, ${0.025 + Math.random() * 0.055})`
        textureContext.beginPath()
        textureContext.ellipse(x, y, radius, radius * (0.25 + Math.random() * 0.55), Math.random() * Math.PI, 0, Math.PI * 2)
        textureContext.fill()
      }

      textureContext.restore()
      resetStaticCanvas()
      paintCover()
    }

    const drawMark = (mark, now, targetContext = context) => {
      const markContext = targetContext
      const age = now - mark.createdAt
      let opacity = 1

      if (maxAgeMs > 0) {
      const fadeStart = maxAgeMs * 0.68
        const fadeDuration = Math.max(1, maxAgeMs - fadeStart)
        const fadeProgress = Math.max(0, age - fadeStart) / fadeDuration
        opacity = Math.max(0, 1 - fadeProgress)
      }

      if (opacity <= 0) {
        return false
      }

      const dx = mark.to.x - mark.from.x
      const dy = mark.to.y - mark.from.y
      const length = Math.max(1, Math.sqrt(dx * dx + dy * dy))
      const normalX = -dy / length
      const normalY = dx / length

      markContext.save()
      markContext.globalCompositeOperation = hideOnScratch ? "source-over" : "destination-out"
      markContext.fillStyle = scaledPreset.coverColor
      markContext.strokeStyle = scaledPreset.coverColor
      markContext.lineCap = "round"
      markContext.lineJoin = "round"

      if (mark.chiselShape) {
        markContext.globalAlpha = opacity * scaledPreset.intensity * mark.force * mark.chiselShape.alpha
        markContext.beginPath()
        mark.chiselShape.points.forEach((point, index) => {
          if (index === 0) {
            markContext.moveTo(point.x, point.y)
          } else {
            markContext.lineTo(point.x, point.y)
          }
        })
        markContext.closePath()
        markContext.fill()
      }

      if (mark.cakeGroove) {
        const currentDistance = Math.max(mark.cakeGroove.lockedDistance || strokeDistanceRef.current, mark.cakeGroove.distance)
        const grooveScale = getCakeScale(currentDistance - mark.cakeGroove.distance)
        const grooveWidth = mark.width * grooveScale
        const drawGrooveLine = (grooveLine) => {
          const offset = grooveWidth * grooveLine.offsetRatio
          const startX = mark.from.x + normalX * offset
          const startY = mark.from.y + normalY * offset
          const endX = mark.to.x + normalX * offset
          const endY = mark.to.y + normalY * offset

          markContext.globalAlpha = opacity * scaledPreset.intensity * mark.force * grooveLine.alpha
          markContext.lineWidth = Math.max(0.75, grooveWidth * grooveLine.lineWidthRatio)
          markContext.beginPath()
          markContext.moveTo(startX, startY)
          markContext.lineTo(endX, endY)
          markContext.stroke()
        }

        drawGrooveLine(mark.cakeGroove.center)
        mark.cakeGroove.sideCuts.forEach(drawGrooveLine)
      }

      mark.toolMarks.forEach((toolMark) => {
        const startX = mark.from.x + dx * toolMark.start + normalX * toolMark.offset
        const startY = mark.from.y + dy * toolMark.start + normalY * toolMark.offset
        const endX = mark.from.x + dx * toolMark.end + normalX * (toolMark.offset + toolMark.wobble * 0.45)
        const endY = mark.from.y + dy * toolMark.end + normalY * (toolMark.offset + toolMark.wobble * 0.45)
        const midX = (startX + endX) / 2 + normalX * toolMark.wobble
        const midY = (startY + endY) / 2 + normalY * toolMark.wobble

        markContext.globalAlpha = opacity * scaledPreset.intensity * mark.force * toolMark.alpha
        markContext.lineWidth = toolMark.lineWidth
        markContext.beginPath()
        markContext.moveTo(startX, startY)
        markContext.quadraticCurveTo(midX, midY, endX, endY)
        markContext.stroke()
      })

      mark.dryScratches.forEach((scratch) => {
        const startX = mark.from.x + dx * scratch.start + normalX * scratch.offset
        const startY = mark.from.y + dy * scratch.start + normalY * scratch.offset
        const endX = mark.from.x + dx * scratch.end + normalX * (scratch.offset + scratch.wobble)
        const endY = mark.from.y + dy * scratch.end + normalY * (scratch.offset + scratch.wobble)

        markContext.globalAlpha = opacity * scaledPreset.intensity * mark.force * scratch.alpha
        markContext.lineWidth = scratch.lineWidth
        markContext.beginPath()
        markContext.moveTo(startX, startY)
        markContext.lineTo(endX, endY)
        markContext.stroke()
      })

      mark.bristles.forEach((bristle) => {
        const startX = mark.from.x + dx * bristle.start + normalX * bristle.offset
        const startY = mark.from.y + dy * bristle.start + normalY * bristle.offset
        const endX = mark.from.x + dx * bristle.end + normalX * (bristle.offset + bristle.wobble * 0.45)
        const endY = mark.from.y + dy * bristle.end + normalY * (bristle.offset + bristle.wobble * 0.45)
        const midX = (startX + endX) / 2 + normalX * bristle.wobble
        const midY = (startY + endY) / 2 + normalY * bristle.wobble

        markContext.globalAlpha = opacity * scaledPreset.intensity * mark.force * bristle.alpha
        markContext.lineWidth = bristle.lineWidth
        markContext.beginPath()
        markContext.moveTo(startX, startY)
        if (bristle.straight) {
          markContext.lineTo(endX, endY)
        } else {
          markContext.quadraticCurveTo(midX, midY, endX, endY)
        }
        markContext.stroke()
      })

      mark.chips.forEach((chip) => {
        markContext.save()
        markContext.translate(chip.x, chip.y)
        markContext.rotate(chip.rotation)
        markContext.globalAlpha = opacity * scaledPreset.intensity * mark.force * chip.alpha
        markContext.beginPath()
        markContext.ellipse(0, 0, chip.rx, chip.ry, 0, 0, Math.PI * 2)
        markContext.fill()
        markContext.restore()
      })

      markContext.globalCompositeOperation = "source-over"
      markContext.fillStyle = scaledPreset.coverColor
      markContext.strokeStyle = scaledPreset.coverColor

      mark.chiselNoise.forEach((noise) => {
        markContext.save()
        markContext.translate(noise.x, noise.y)
        markContext.rotate(noise.rotation)
        markContext.globalAlpha = opacity * mark.force * noise.alpha
        markContext.beginPath()
        markContext.ellipse(0, 0, noise.rx, noise.ry, 0, 0, Math.PI * 2)
        markContext.fill()
        markContext.restore()
      })

      mark.crumbs.forEach((crumb) => {
        markContext.save()
        markContext.translate(crumb.x, crumb.y)
        markContext.rotate(crumb.rotation)
        markContext.globalAlpha = opacity * mark.force * crumb.alpha
        markContext.beginPath()
        markContext.ellipse(0, 0, crumb.rx, crumb.ry, 0, 0, Math.PI * 2)
        markContext.fill()
        markContext.restore()
      })

      mark.skips.forEach((skip) => {
        markContext.save()
        markContext.translate(skip.x, skip.y)
        markContext.rotate(skip.rotation)
        markContext.globalAlpha = opacity * mark.force * skip.alpha
        markContext.beginPath()
        markContext.ellipse(0, 0, skip.rx, skip.ry, 0, 0, Math.PI * 2)
        markContext.fill()
        markContext.restore()
      })

      mark.ridges.forEach((ridge) => {
        markContext.globalCompositeOperation = "source-over"
        markContext.strokeStyle = ridge.highlight ? "rgba(255, 255, 250, 1)" : "rgba(64, 64, 58, 1)"
        const startX = mark.from.x + normalX * ridge.offset
        const startY = mark.from.y + normalY * ridge.offset
        const endX = mark.to.x + normalX * (ridge.offset + ridge.wobble * 0.35)
        const endY = mark.to.y + normalY * (ridge.offset + ridge.wobble * 0.35)
        const midX = (startX + endX) / 2 + normalX * ridge.wobble
        const midY = (startY + endY) / 2 + normalY * ridge.wobble

        markContext.globalAlpha = opacity * mark.force * ridge.alpha
        markContext.lineWidth = ridge.lineWidth
        markContext.beginPath()
        markContext.moveTo(startX, startY)
        markContext.quadraticCurveTo(midX, midY, endX, endY)
        markContext.stroke()
      })

      markContext.restore()
      return true
    }

    const draw = (now) => {
      if (maxAgeMs > 0 && lastRenderAt && now - lastRenderAt < 32) {
        frameRef.current = window.requestAnimationFrame(draw)
        return
      }

      lastRenderAt = now
      paintCover()
      context.save()
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      marksRef.current = marksRef.current.filter((mark) => drawMark(mark, now))
      context.restore()

      if (marksRef.current.length > 0) {
        frameRef.current = window.requestAnimationFrame(draw)
      } else {
        frameRef.current = null
        paintCover()
      }
    }

    const startDrawing = () => {
      if (!frameRef.current) {
        frameRef.current = window.requestAnimationFrame(draw)
      }
    }

    const drawStaticMark = (mark, now) => {
      staticContext.save()
      staticContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      drawMark(mark, now, staticContext)
      staticContext.restore()
      copyStaticCanvas()
    }

    const getCakeScale = (travelled) => {
      const openProgress = Math.min(1, Math.max(0, travelled) / 92)
      const easedProgress = openProgress * openProgress * (3 - 2 * openProgress)

      return 0.08 + easedProgress * 0.92
    }

    const getStrokeWidth = () => {
      if (!scaledPreset.stableWidth) {
        return scaledPreset.brushMin + Math.random() * (scaledPreset.brushMax - scaledPreset.brushMin)
      }

      if (!strokeWidthRef.current) {
        strokeWidthRef.current = scaledPreset.brushMin + Math.random() * (scaledPreset.brushMax - scaledPreset.brushMin)
      }

      return strokeWidthRef.current
    }

    const getChiselWidth = (distance) => {
      const speedRatio = Math.min(1, distance / 44)
      const targetWidth = scaledPreset.brushMin + (scaledPreset.brushMax - scaledPreset.brushMin) * speedRatio

      if (!chiselWidthRef.current) {
        chiselWidthRef.current = Math.max(2 * safeStrokeScale, scaledPreset.brushMin * 0.18)
      }

      chiselWidthRef.current += (targetWidth - chiselWidthRef.current) * 0.22
      return chiselWidthRef.current
    }

    const addSegment = (from, to, force = 1, widthScale = 1, widthOverride = null, shapeMeta = null) => {
      const now = performance.now()
      const baseWidth = widthOverride || getStrokeWidth()
      const width = baseWidth * widthScale

      if (scaledPreset.continuousStroke && !strokeBristlesRef.current) {
        strokeBristlesRef.current = createStrokeBristles(scaledPreset, getStrokeWidth())
      }

      const mark = makeScratchMark(from, to, width, now, force, scaledPreset, strokeBristlesRef.current, shapeMeta)

      if (useStaticCanvas) {
        drawStaticMark(mark, now)
        return
      }

      marksRef.current.push(mark)

      if (markLimit > 0 && marksRef.current.length > markLimit) {
        marksRef.current.splice(0, marksRef.current.length - markLimit)
      }

      startDrawing()
    }

    const addStroke = (point, force = 1) => {
      const previousPoint = previousPointRef.current || {
        x: point.x,
        y: point.y,
      }

      if (!strokeStartRef.current) {
        strokeStartRef.current = previousPoint
      }

      const dx = point.x - previousPoint.x
      const dy = point.y - previousPoint.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const maxSteps = scaledPreset.impasto ? 18 : 8
      const steps = Math.min(maxSteps, Math.max(1, Math.floor(distance / scaledPreset.stepDistance)))
      const jitter = scaledPreset.jitter || 8
      const strokeWidth = scaledPreset.opensFromPoint ? Math.max(1, getStrokeWidth()) : 1
      const startDistance = strokeDistanceRef.current
      const chiselWidth = scaledPreset.chiselScrape ? getChiselWidth(distance) : null
      for (let index = 1; index <= steps; index += 1) {
        const previousProgress = (index - 1) / steps
        const progress = index / steps
        const shouldKeepPureGesture = (scaledPreset.scrape || scaledPreset.cakeCut || scaledPreset.chiselScrape || scaledPreset.opensFromPoint || scaledPreset.continuousStroke) && previousPointRef.current
        const from = {
          x: previousPoint.x + dx * previousProgress + (shouldKeepPureGesture ? 0 : (Math.random() - 0.5) * jitter),
          y: previousPoint.y + dy * previousProgress + (shouldKeepPureGesture ? 0 : (Math.random() - 0.5) * jitter),
        }
        const to = {
          x: previousPoint.x + dx * progress + (shouldKeepPureGesture ? 0 : (Math.random() - 0.5) * jitter),
          y: previousPoint.y + dy * progress + (shouldKeepPureGesture ? 0 : (Math.random() - 0.5) * jitter),
        }
        let widthScale = 1
        let shapeMeta = null

        if (scaledPreset.cakeCut) {
          shapeMeta = {
            cakeDistance: startDistance + distance * previousProgress,
          }
        } else if (scaledPreset.opensFromPoint) {
          const minScale = scaledPreset.extremeOpen ? 1 / strokeWidth : Math.max(0.45, 1 / strokeWidth)
          const travelled = startDistance + distance * progress
          const openProgress = Math.max(0, travelled - 5) / (scaledPreset.extremeOpen ? 75 : 38)
          const easedProgress = Math.min(1, openProgress * openProgress * (3 - 2 * openProgress))
          widthScale = minScale + easedProgress * (1 - minScale)
        }

        addSegment(from, to, force, widthScale, chiselWidth, shapeMeta)
      }

      strokeDistanceRef.current += distance
      previousPointRef.current = point
    }

    const onPointerMove = (event) => {
      if (event.pointerType === "touch") {
        return
      }

      if (event.shiftKey) {
        stopStroke()
        return
      }

      const now = performance.now()

      if (now - lastMoveRef.current < (preset.moveThrottle || 34)) {
        return
      }

      lastMoveRef.current = now
      const point = getPointFromEvent(event, root.getBoundingClientRect())

      if (point) {
        addStroke(point, 0.92)
      } else {
        stopStroke()
      }
    }

    const stopStroke = () => {
      touchGestureRef.current = null
      const finalDistance = strokeDistanceRef.current

      if (finalDistance > 0) {
        marksRef.current.forEach((mark) => {
          if (mark.cakeGroove && !mark.cakeGroove.lockedDistance) {
            mark.cakeGroove.lockedDistance = finalDistance
          }
        })
      }

      previousPointRef.current = null
      strokeStartRef.current = null
      strokeDistanceRef.current = 0
      strokeWidthRef.current = null
      chiselWidthRef.current = null
      strokeBristlesRef.current = null
    }

    const addTouchStroke = (event, force = 1) => {
      const now = performance.now()

      if (now - lastMoveRef.current < (preset.moveThrottle || 34)) {
        return
      }

      lastMoveRef.current = now
      const point = getPointFromEvent(event, root.getBoundingClientRect())

      if (point) {
        addStroke(point, force)
      } else {
        stopStroke()
      }
    }

    const onTouchStart = (event) => {
      if (isInteractiveElement(event.target)) {
        touchGestureRef.current = null
        return
      }

      const point = getPointFromEvent(event, root.getBoundingClientRect())

      if (!point) {
        touchGestureRef.current = null
        return
      }

      touchGestureRef.current = { active: true }
      previousPointRef.current = null

      if (event.cancelable) {
        event.preventDefault()
      }

      addStroke(point, 0.85)
    }

    const onTouchMove = (event) => {
      if (!touchGestureRef.current?.active) {
        return
      }

      if (event.cancelable) {
        event.preventDefault()
      }

      addTouchStroke(event, 1)
    }

    const onTouchEnd = () => {
      stopStroke()
    }

    const onScroll = () => {
      if (isCoarsePointer) {
        return
      }

      const now = performance.now()
      const scrollInterval = scaledPreset.scrollInterval || 420

      if (now - lastScrollRef.current < scrollInterval) {
        return
      }

      const bounds = root.getBoundingClientRect()

      if (bounds.bottom < 0 || bounds.top > window.innerHeight) {
        return
      }

      lastScrollRef.current = now
      addSegment({
        x: bounds.width * (0.16 + Math.random() * 0.22),
        y: bounds.height * (0.2 + Math.random() * 0.6),
      }, {
        x: bounds.width * (0.3 + Math.random() * 0.46),
        y: bounds.height * (0.2 + Math.random() * 0.6),
      }, scaledPreset.scrollForce || 0.24)
    }

    resize()
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerup", stopStroke)
    window.addEventListener("touchstart", onTouchStart, { passive: false })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", onTouchEnd)
    window.addEventListener("touchcancel", onTouchEnd)
    window.addEventListener("blur", stopStroke)
    window.addEventListener("resize", resize)
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", stopStroke)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
      window.removeEventListener("touchcancel", onTouchEnd)
      window.removeEventListener("blur", stopStroke)
      window.removeEventListener("resize", resize)
      window.removeEventListener("scroll", onScroll)

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [scaledPreset, presetKey, reducedMotion, hideOnScratch])

  return (
    <ScratchRoot ref={rootRef} className={className} aria-hidden="true">
      <GradientLayer $backgroundImage={backgroundImage} $showTexture={textureEnabled} />
      {!reducedMotion && <ScratchCanvas ref={canvasRef} />}
      <LightVeil $showTexture={textureEnabled} />
    </ScratchRoot>
  )
}

export default ScratchRevealBackground

const ScratchRoot = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
`

const GradientLayer = styled.div`
  position: absolute;
  inset: 0;
  background:
    ${({ $backgroundImage }) => $backgroundImage ? `url("${$backgroundImage}") center / cover no-repeat,` : ""}
    ${({ $showTexture }) => $showTexture ? "repeating-linear-gradient(92deg, rgba(255, 255, 255, 0.08) 0 1px, transparent 1px 7px)," : ""}
    radial-gradient(ellipse at 19% 24%, rgba(238, 77, 74, 0.38), transparent 28%),
    radial-gradient(ellipse at 76% 18%, rgba(25, 177, 171, 0.44), transparent 31%),
    radial-gradient(ellipse at 67% 76%, rgba(239, 180, 46, 0.48), transparent 34%),
    radial-gradient(ellipse at 30% 78%, rgba(22, 82, 126, 0.35), transparent 28%),
    linear-gradient(135deg, #f2c7cd 0%, #d8ebe5 34%, #bad2da 64%, #efd89b 100%);
  filter: saturate(1.02) contrast(1.02);
`

const ScratchCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: none;
`

const LightVeil = styled.div`
  position: absolute;
  inset: 0;
  background:
    ${({ $showTexture }) => $showTexture ? "repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.055) 0 1px, transparent 1px 5px)," : ""}
    linear-gradient(90deg, rgba(237, 236, 230, 0.13), rgba(237, 236, 230, 0.03), rgba(237, 236, 230, 0.16)),
    radial-gradient(circle at 50% 46%, rgba(255, 255, 255, 0.08), transparent 48%);
  mix-blend-mode: screen;
  pointer-events: none;
`






