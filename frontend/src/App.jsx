import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import portrait from '../public/VERT_original-girl-only-xhigh-bw.webp'
import './App.css'

const MODES = [
  { id: 'mode-1', label: 'I', end: true },
  { id: 'mode-2', label: 'II', end: false },
  { id: 'mode-3', label: 'III', end: false },
  { id: 'mode-4', label: 'IV', end: false },
  { id: 'mode-5', label: 'V', end: true },
]

const MODE_UNITS = [1, 2, 2, 2, 1]
const MODE_TOTAL = MODE_UNITS.reduce((sum, unit) => sum + unit, 0)

const KAWIN = [
  { text: 'Kawin', script: 'latin' },
  { text: 'கவின்', script: 'tamil' },
  { text: 'कविन', script: 'hindi' },
  { text: 'Кавин', script: 'russian' },
]

function graphemes(text) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(
      (part) => part.segment,
    )
  }
  return Array.from(text)
}

function useTypewriter(target, { typeMs = 70, eraseMs = 40 } = {}) {
  const [shown, setShown] = useState(target)
  const shownRef = useRef(target)
  const run = useRef(0)

  useEffect(() => {
    if (shownRef.current === target) return undefined

    const id = (run.current += 1)
    let frame

    const tick = () => {
      if (run.current !== id) return
      const current = shownRef.current
      if (current === target) return

      const currentParts = graphemes(current)
      const targetParts = graphemes(target)

      if (!target.startsWith(current) && currentParts.length > 0) {
        const next = currentParts.slice(0, -1).join('')
        shownRef.current = next
        setShown(next)
        frame = window.setTimeout(tick, eraseMs)
        return
      }

      const next = targetParts.slice(0, graphemes(shownRef.current).length + 1).join('')
      shownRef.current = next
      setShown(next)
      if (next !== target) {
        frame = window.setTimeout(tick, typeMs)
      }
    }

    frame = window.setTimeout(tick, eraseMs)
    return () => {
      run.current += 1
      window.clearTimeout(frame)
    }
  }, [target, typeMs, eraseMs])

  return shown
}

function themeFor(mode) {
  if (mode === 1 || mode === 0) return 'blue';
  if (mode === 3 || mode === 4) return 'green';
  else return 'red';
}

function thumbVars(index) {
  const start = MODE_UNITS.slice(0, index).reduce((sum, unit) => sum + unit, 0)
  return {
    '--thumb-start': start,
    '--thumb-span': MODE_UNITS[index],
    '--thumb-total': MODE_TOTAL,
  }
}

function FitTitle({ lines }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    const box = el?.parentElement
    if (!el || !box) return undefined

    const fit = () => {
      const base = 100
      el.style.fontSize = `${base}px`
      const boxRect = box.getBoundingClientRect()
      const padX = boxRect.width * 0.03
      const padY = boxRect.height * 0.04
      const next = base * Math.min(
        (boxRect.width - padX * 2) / Math.max(el.scrollWidth, 1),
        (boxRect.height - padY * 2) / Math.max(el.scrollHeight, 1),
      )
      el.style.fontSize = `${Math.max(16, next)}px`
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    document.fonts.ready.then(fit)
    return () => observer.disconnect()
  }, [lines])

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
  const theme = themeFor(mode)
  const name = KAWIN[nameIndex]
  const typed = useTypewriter(name.text)
  const revealSrc =
    mode === 3 || mode === 4
      ? '/VERT_wireframe.webp'
      : '/VERT_original-girl-only-xhigh.webp'
  const bwRef = useRef(null)
  const colorRef = useRef(null)

  useEffect(() => {
    const radius = 150
    const paint = (x, y, lit) => {
      const torch = colorRef.current
      if (!torch) return
      const mask = `radial-gradient(circle ${radius}px at ${x}px ${y}px, #000 0%, #000 42%, transparent 74%)`
      const clip = lit ? `circle(${radius}px at ${x}px ${y}px)` : 'circle(0px at 0 0)'
      torch.style.opacity = lit ? '1' : '0'
      torch.style.webkitMaskImage = mask
      torch.style.maskImage = mask
      torch.style.webkitMaskRepeat = 'no-repeat'
      torch.style.maskRepeat = 'no-repeat'
      torch.style.webkitMaskSize = '100% 100%'
      torch.style.maskSize = '100% 100%'
      torch.style.webkitClipPath = clip
      torch.style.clipPath = clip
    }

    const move = (event) => {
      const base = bwRef.current
      if (!base) return
      const rect = base.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const lit = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height
      paint(x, y, lit)
    }

    const leave = () => paint(0, 0, false)

    window.addEventListener('pointermove', move)
    document.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('mouseleave', leave)
    }
  }, [])

  useEffect(() => {
    if (colorRef.current) {
      colorRef.current.style.backgroundImage = `url(${revealSrc})`
    }
  }, [revealSrc])

  const cycleName = () => {
    setNameIndex((index) => (index + 1) % KAWIN.length)
  }

  return (
    <main
      className="stage"
      data-theme={theme}
      data-mode={mode}
      onClick={cycleName}
    >
      <h1
        className={`wordmark${theme === 'red' ? ' is-in' : ''}`}
        aria-label={`JC ${name.text}`}
        aria-hidden={theme !== 'red'}
      >
        <span className="wordmark-side wordmark-side--left">JC</span>
        <span
          className="wordmark-side wordmark-side--right"
          data-script={name.script}
        >
          {typed}
          <span className="wordmark-caret" aria-hidden="true" />
        </span>
      </h1>

      <aside
        className={`cutout cutout--right${mode === 1 ? ' is-in' : ''}`}
        aria-hidden={mode !== 1}
      >
        <FitTitle lines={['software', 'engineer']} />
      </aside>

      <aside
        className={`cutout cutout--left${mode === 3 ? ' is-in' : ''}`}
        aria-hidden={mode !== 3}
      >
        <FitTitle lines={['game', 'designer']} />
      </aside>

      <div className="hero">
        <div className="portrait-stack">
          <img ref={bwRef} src={portrait} alt="" className="portrait" />
          <div
            key={revealSrc}
            ref={colorRef}
            className="portrait-torch"
            style={{ backgroundImage: `url(${revealSrc})` }}
            aria-hidden="true"
          />
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
