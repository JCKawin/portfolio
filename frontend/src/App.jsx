import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import portraitBw from '../public/VERT_original-girl-only-xhigh-bw.webp'
import portraitColor from '../public/VERT_original-girl-only-xhigh.webp'
import portraitWire from '../public/VERT_wireframe.webp'
import './App.css'

const IMG = {
  bw: portraitBw,
  color: portraitColor,
  wire: portraitWire,
}

const MODES = [
  { id: 'mode-1', label: 'I', end: true, theme: 'blue', panel: null, reveal: 'color' },
  { id: 'mode-2', label: 'II', end: false, theme: 'blue', panel: 'engineer', reveal: 'color' },
  { id: 'mode-3', label: 'III', end: false, theme: 'red', panel: null, reveal: 'color' },
  { id: 'mode-4', label: 'IV', end: false, theme: 'green', panel: 'designer', reveal: 'wire' },
  { id: 'mode-5', label: 'V', end: true, theme: 'green', panel: null, reveal: 'wire' },
]

const MODE_UNITS = [1, 2, 2, 2, 1]
const MODE_TOTAL = MODE_UNITS.reduce((sum, unit) => sum + unit, 0)

const KAWIN = [
  { text: 'Kawin', script: 'latin' },
  { text: 'கவின்', script: 'tamil' },
  { text: 'कविन', script: 'hindi' },
  { text: 'Кавин', script: 'russian' },
]

const TORCH_RADIUS = 150

function graphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(
      (part) => part.segment,
    )
  }
  return Array.from(text)
}

function useTypewriter(target, { typeMs = 64, eraseMs = 36 } = {}) {
  const [shown, setShown] = useState(target)
  const shownRef = useRef(target)

  useEffect(() => {
    if (shownRef.current === target) return undefined

    let frame = 0
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const current = shownRef.current
      if (current === target) return

      const currentParts = graphemes(current)
      const targetParts = graphemes(target)
      const isPrefix = targetParts.slice(0, currentParts.length).join('') === current

      const next = !isPrefix && currentParts.length > 0
        ? currentParts.slice(0, -1).join('')
        : targetParts.slice(0, currentParts.length + 1).join('')

      shownRef.current = next
      setShown(next)
      if (next !== target) {
        frame = window.setTimeout(tick, isPrefix || currentParts.length === 0 ? typeMs : eraseMs)
      }
    }

    frame = window.setTimeout(tick, eraseMs)
    return () => {
      cancelled = true
      window.clearTimeout(frame)
    }
  }, [target, typeMs, eraseMs])

  return shown
}

function useTorch(baseRef, canvasRef, revealSrc) {
  useEffect(() => {
    const image = new Image()
    image.src = revealSrc
    let raf = 0
    let last = { x: 0, y: 0, lit: false }

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
      if (!last.lit || !image.complete) return
      ctx.drawImage(image, 0, 0, width, height)
      const gradient = ctx.createRadialGradient(
        last.x,
        last.y,
        TORCH_RADIUS * 0.45,
        last.x,
        last.y,
        TORCH_RADIUS,
      )
      gradient.addColorStop(0, 'rgba(0,0,0,1)')
      gradient.addColorStop(0.55, 'rgba(0,0,0,0.85)')
      gradient.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.globalCompositeOperation = 'destination-in'
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'source-over'
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

    image.addEventListener('load', draw)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('blur', hide)
    document.addEventListener('mouseleave', hide)
    return () => {
      cancelAnimationFrame(raf)
      image.removeEventListener('load', draw)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('blur', hide)
      document.removeEventListener('mouseleave', hide)
    }
  }, [baseRef, canvasRef, revealSrc])
}

function thumbVars(index) {
  const start = MODE_UNITS.slice(0, index).reduce((sum, unit) => sum + unit, 0)
  return {
    '--thumb-start': start,
    '--thumb-span': MODE_UNITS[index],
    '--thumb-total': MODE_TOTAL,
  }
}

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
      const next =
        80 *
        Math.min(
          (boxRect.width - padX) / Math.max(el.scrollWidth, 1),
          (boxRect.height - padY) / Math.max(el.scrollHeight, 1),
        )
      el.style.fontSize = `${Math.max(18, next)}px`
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

function App() {
  const [mode, setMode] = useState(2)
  const [nameIndex, setNameIndex] = useState(0)
  const current = MODES[mode]
  const name = KAWIN[nameIndex]
  const typed = useTypewriter(name.text)
  const revealSrc = current.reveal === 'wire' ? IMG.wire : IMG.color
  const showWordmark = current.panel === null
  const bwRef = useRef(null)
  const canvasRef = useRef(null)

  useTorch(bwRef, canvasRef, revealSrc)

  return (
    <main className="stage" data-theme={current.theme} data-mode={mode}>
      <h1
        className={`wordmark${showWordmark ? ' is-in' : ''}`}
        aria-label={`JC ${name.text}`}
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
            onClick={() => setNameIndex((index) => (index + 1) % KAWIN.length)}
          >
            {typed}
            <span className="wordmark-caret" aria-hidden="true" />
          </button>
        </span>
      </h1>

      <aside
        className={`cutout cutout--right${current.panel === 'engineer' ? ' is-in' : ''}`}
        aria-hidden={current.panel !== 'engineer'}
      >
        <FitTitle lines={['software', 'engineer']} active={current.panel === 'engineer'} />
      </aside>

      <aside
        className={`cutout cutout--left${current.panel === 'designer' ? ' is-in' : ''}`}
        aria-hidden={current.panel !== 'designer'}
      >
        <FitTitle lines={['game', 'designer']} active={current.panel === 'designer'} />
      </aside>

      <div className="hero">
        <div className="portrait-stack">
          <img ref={bwRef} src={IMG.bw} alt="" className="portrait" />
          <canvas ref={canvasRef} className="portrait-torch" aria-hidden="true" />
        </div>
      </div>

      <div className="mode-rail" role="tablist" aria-label="Modes">
        <div className="mode-track" style={thumbVars(mode)}>
          <span className="mode-thumb" aria-hidden="true" />
          {MODES.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              className={`mode${index === mode ? ' is-active' : ''}${item.end ? ' is-end' : ''}`}
              aria-selected={index === mode}
              onClick={() => setMode(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}

export default App
