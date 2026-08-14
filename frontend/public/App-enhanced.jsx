import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react'
import portraitBw from '../public/VERT_original-girl-only-xhigh-bw.webp'
import portraitColor from '../public/VERT_original-girl-only-xhigh.webp'
import portraitWire from '../public/VERT_wireframe.webp'
import './App.css'

/* ============================================================
   KAWIN PORTFOLIO — ENHANCED REACT APP
   Cinematic interactive portfolio with torch reveal,
   theme transitions, and multi-script typography.
   ============================================================ */

/* ── Asset Map ── */
const IMG = {
  bw: portraitBw,
  color: portraitColor,
  wire: portraitWire,
}

/* ── Mode Configuration ──
   Each mode defines a theme, panel state, and reveal image.
   I, III, V are "end" modes (narrower rail buttons).
   II reveals engineer panel. IV reveals designer panel + wireframe.
*/
const MODES = [
  { id: 'mode-1', label: 'I',   end: true,  theme: 'blue',  panel: null,       reveal: 'color' },
  { id: 'mode-2', label: 'II',  end: false, theme: 'blue',  panel: 'engineer', reveal: 'color' },
  { id: 'mode-3', label: 'III', end: false, theme: 'red',   panel: null,       reveal: 'color' },
  { id: 'mode-4', label: 'IV',  end: false, theme: 'green', panel: 'designer', reveal: 'wire'  },
  { id: 'mode-5', label: 'V',   end: true,  theme: 'green', panel: null,       reveal: 'wire'  },
]

/* Grid units for the sliding thumb: [1,2,2,2,1] = 8 total */
const MODE_UNITS = [1, 2, 2, 2, 1]
const MODE_TOTAL = MODE_UNITS.reduce((a, b) => a + b, 0)

/* ── Name Variants (Cyclable) ── */
const KAWIN = [
  { text: 'Kawin',   script: 'latin' },
  { text: 'கவின்',   script: 'tamil' },
  { text: 'कविन',    script: 'hindi' },
  { text: 'Кавин',   script: 'russian' },
]

/* ── Constants ── */
const TORCH_RADIUS = 160
const TORCH_INNER_RADIUS = TORCH_RADIUS * 0.4
const PARTICLE_COUNT = 36

/* ============================================================
   UTILITY: Grapheme Splitting
   Uses Intl.Segmenter when available for proper Unicode
   grapheme cluster support (emoji, Tamil, Hindi, etc.)
   ============================================================ */
function graphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(
      (part) => part.segment,
    )
  }
  return Array.from(text)
}

/* ============================================================
   HOOK: useTypewriter
   Smooth typewriter effect with configurable speed.
   Erases mismatched prefix before typing new content.
   ============================================================ */
function useTypewriter(target, { typeMs = 58, eraseMs = 32 } = {}) {
  const [shown, setShown] = useState(target)
  const shownRef = useRef(target)
  const frameRef = useRef(0)

  useEffect(() => {
    if (shownRef.current === target) return undefined

    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const current = shownRef.current
      if (current === target) return

      const currentParts = graphemes(current)
      const targetParts = graphemes(target)
      const isPrefix = targetParts.slice(0, currentParts.length).join('') === current

      const next =
        !isPrefix && currentParts.length > 0
          ? currentParts.slice(0, -1).join('')
          : targetParts.slice(0, currentParts.length + 1).join('')

      shownRef.current = next
      setShown(next)

      if (next !== target) {
        const delay = isPrefix || currentParts.length === 0 ? typeMs : eraseMs
        frameRef.current = window.setTimeout(tick, delay)
      }
    }

    frameRef.current = window.setTimeout(tick, eraseMs)
    return () => {
      cancelled = true
      window.clearTimeout(frameRef.current)
    }
  }, [target, typeMs, eraseMs])

  return shown
}

/* ============================================================
   HOOK: useTorch
   Canvas-based torch reveal effect.
   Draws the reveal image masked by a radial gradient that
   follows the cursor. Includes a subtle glow ring.
   ============================================================ */
function useTorch(baseRef, canvasRef, revealSrc) {
  useEffect(() => {
    const image = new Image()
    image.src = revealSrc
    image.crossOrigin = 'anonymous'

    let raf = 0
    let last = { x: 0, y: 0, lit: false }
    let imageReady = false

    const draw = () => {
      const canvas = canvasRef.current
      const base = baseRef.current
      if (!canvas || !base) return

      const width = Math.max(1, Math.round(base.clientWidth))
      const height = Math.max(1, Math.round(base.clientHeight))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, width, height)

      if (!last.lit || !imageReady) return

      // Draw reveal image
      ctx.drawImage(image, 0, 0, width, height)

      // Create radial mask (dark center = visible, transparent edge = hidden)
      const gradient = ctx.createRadialGradient(
        last.x, last.y, TORCH_INNER_RADIUS,
        last.x, last.y, TORCH_RADIUS,
      )
      gradient.addColorStop(0, 'rgba(0,0,0,1)')
      gradient.addColorStop(0.5, 'rgba(0,0,0,0.9)')
      gradient.addColorStop(0.85, 'rgba(0,0,0,0.5)')
      gradient.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.globalCompositeOperation = 'destination-in'
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'source-over'

      // Subtle glow ring
      const glow = ctx.createRadialGradient(
        last.x, last.y, TORCH_RADIUS * 0.9,
        last.x, last.y, TORCH_RADIUS * 1.15,
      )
      glow.addColorStop(0, 'rgba(255,255,255,0.08)')
      glow.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)
    }

    const onImageLoad = () => {
      imageReady = true
      draw()
    }

    const move = (event) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const base = baseRef.current
        if (!base) return
        const rect = base.getBoundingClientRect()
        last = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          lit:
            event.clientX >= rect.left &&
            event.clientY >= rect.top &&
            event.clientX <= rect.right &&
            event.clientY <= rect.bottom,
        }
        draw()
      })
    }

    const hide = () => {
      last.lit = false
      draw()
    }

    image.addEventListener('load', onImageLoad)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('blur', hide)
    document.addEventListener('mouseleave', hide)

    return () => {
      cancelAnimationFrame(raf)
      image.removeEventListener('load', onImageLoad)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('blur', hide)
      document.removeEventListener('mouseleave', hide)
    }
  }, [baseRef, canvasRef, revealSrc])
}

/* ============================================================
   HOOK: useParticles
   Ambient floating particles for atmospheric depth.
   Renders to a dedicated canvas layer.
   ============================================================ */
function useParticles(canvasRef, theme) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    let raf = 0
    let w = 0
    let h = 0

    const resize = () => {
      w = canvas.width = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.4 + 0.1,
      phase: Math.random() * Math.PI * 2,
    }))

    const themeColor =
      theme === 'blue' ? '200, 220, 255' :
      theme === 'green' ? '180, 255, 200' :
      '255, 180, 180'

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const time = Date.now() * 0.001

      particles.forEach((p) => {
        p.x += p.vx + Math.sin(time + p.phase) * 0.15
        p.y += p.vy

        if (p.y < -10) {
          p.y = h + 10
          p.x = Math.random() * w
        }
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10

        const flicker = 0.85 + Math.sin(time * 2 + p.phase) * 0.15
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${themeColor}, ${p.alpha * flicker})`
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [canvasRef, theme])
}

/* ============================================================
   HOOK: useImagePreloader
   Preloads all portrait images to prevent flicker on mode change.
   ============================================================ */
function useImagePreloader(sources) {
  useEffect(() => {
    const images = sources.map((src) => {
      const img = new Image()
      img.src = src
      return img
    })
    return () => {
      images.forEach((img) => { img.src = '' })
    }
  }, [sources])
}

/* ============================================================
   UTILITY: thumbVars
   Computes CSS custom properties for the sliding mode thumb.
   ============================================================ */
function thumbVars(index) {
  const start = MODE_UNITS.slice(0, index).reduce((sum, unit) => sum + unit, 0)
  return {
    '--thumb-start': start,
    '--thumb-span': MODE_UNITS[index],
    '--thumb-total': MODE_TOTAL,
  }
}

/* ============================================================
   COMPONENT: FitTitle
   Auto-fitting title text that scales to its container.
   Uses ResizeObserver for responsive font sizing.
   ============================================================ */
function FitTitle({ lines, active }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    const box = el?.parentElement
    if (!el || !box) return undefined

    const fit = () => {
      el.style.fontSize = '80px'
      const boxRect = box.getBoundingClientRect()
      const styles = getComputedStyle(box)
      const padX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
      const padY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom)
      const scale = Math.min(
        (boxRect.width - padX) / Math.max(el.scrollWidth, 1),
        (boxRect.height - padY) / Math.max(el.scrollHeight, 1),
      )
      const next = 80 * scale
      el.style.fontSize = `${Math.max(16, Math.min(next, 80))}px`
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    document.fonts.ready.then(fit)

    return () => observer.disconnect()
  }, [lines, active])

  return (
    <p ref={ref} className="cutout-title">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </p>
  )
}

/* ============================================================
   COMPONENT: IntroScreen
   Brief loading/entrance animation that fades out once ready.
   ============================================================ */
function IntroScreen({ onComplete }) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setDone(true)
      onComplete?.()
    }, 1800)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <div className={`intro-screen${done ? ' is-done' : ''}`} aria-hidden="true">
      <span className="intro-text">JC</span>
    </div>
  )
}

/* ============================================================
   MAIN APP
   ============================================================ */
function App() {
  const [mode, setMode] = useState(2)
  const [nameIndex, setNameIndex] = useState(0)
  const [introDone, setIntroDone] = useState(false)

  const current = MODES[mode]
  const name = KAWIN[nameIndex]
  const typed = useTypewriter(name.text)
  const revealSrc = current.reveal === 'wire' ? IMG.wire : IMG.color
  const showWordmark = current.panel === null

  const bwRef = useRef(null)
  const canvasRef = useRef(null)
  const particlesRef = useRef(null)

  // Initialize effects
  useTorch(bwRef, canvasRef, revealSrc)
  useParticles(particlesRef, current.theme)
  useImagePreloader([IMG.bw, IMG.color, IMG.wire])

  /* ── Keyboard Navigation ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setMode((m) => Math.min(m + 1, MODES.length - 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setMode((m) => Math.max(m - 1, 0))
      } else if (e.key >= '1' && e.key <= '5') {
        setMode(parseInt(e.key, 10) - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ── Touch / Swipe Support ── */
  const touchStart = useRef(null)
  const onTouchStart = useCallback((e) => {
    touchStart.current = e.touches[0].clientX
  }, [])
  const onTouchEnd = useCallback((e) => {
    if (touchStart.current == null) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setMode((m) => Math.min(m + 1, MODES.length - 1))
      } else {
        setMode((m) => Math.max(m - 1, 0))
      }
    }
    touchStart.current = null
  }, [])

  /* ── Memoized Handlers ── */
  const cycleName = useCallback(() => {
    setNameIndex((idx) => (idx + 1) % KAWIN.length)
  }, [])

  const selectMode = useCallback((index) => {
    setMode(index)
  }, [])

  /* ── ARIA Labels ── */
  const ariaLabel = useMemo(() => `JC ${name.text}`, [name])

  return (
    <>
      {!introDone && <IntroScreen onComplete={() => setIntroDone(true)} />}

      <main
        className="stage"
        data-theme={current.theme}
        data-mode={mode}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Atmospheric layers */}
        <div className="vignette" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <canvas ref={particlesRef} className="particles-canvas" aria-hidden="true" />

        {/* Wordmark */}
        <h1
          className={`wordmark${showWordmark ? ' is-in' : ''}`}
          aria-label={ariaLabel}
          aria-hidden={!showWordmark}
        >
          <span className="wordmark-side wordmark-side--left">JC</span>
          <span
            className="wordmark-side wordmark-side--right"
            data-script={name.script}
          >
            <button
              type="button"
              className="wordmark-cycle"
              onClick={cycleName}
              aria-label={`Cycle name. Current: ${name.text}`}
              title="Click to cycle name"
            >
              {typed}
              <span className="wordmark-caret" aria-hidden="true" />
            </button>
          </span>
        </h1>

        {/* Engineer Panel (Right) */}
        <aside
          className={`cutout cutout--right${current.panel === 'engineer' ? ' is-in' : ''}`}
          aria-hidden={current.panel !== 'engineer'}
          aria-label="Software Engineer panel"
        >
          <FitTitle
            lines={['software', 'engineer']}
            active={current.panel === 'engineer'}
          />
        </aside>

        {/* Designer Panel (Left) */}
        <aside
          className={`cutout cutout--left${current.panel === 'designer' ? ' is-in' : ''}`}
          aria-hidden={current.panel !== 'designer'}
          aria-label="Game Designer panel"
        >
          <FitTitle
            lines={['game', 'designer']}
            active={current.panel === 'designer'}
          />
        </aside>

        {/* Hero Portrait with Torch */}
        <div className="hero">
          <div className="portrait-stack">
            <img
              ref={bwRef}
              src={IMG.bw}
              alt=""
              className="portrait"
              draggable="false"
              loading="eager"
            />
            <canvas
              ref={canvasRef}
              className="portrait-torch"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Mode Rail */}
        <nav className="mode-rail" role="tablist" aria-label="Portfolio modes">
          <div className="mode-track" style={thumbVars(mode)}>
            <span className="mode-thumb" aria-hidden="true" />
            {MODES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                className={`mode${index === mode ? ' is-active' : ''}${item.end ? ' is-end' : ''}`}
                aria-selected={index === mode}
                aria-label={`Mode ${item.label}: ${item.theme}${item.panel ? `, ${item.panel}` : ''}`}
                onClick={() => selectMode(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </main>
    </>
  )
}

export default App
