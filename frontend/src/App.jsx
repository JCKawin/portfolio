import { useState } from 'react'
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

const CUTOUTS = {
  1: { side: 'right', lines: ['software', 'engineer'] },
  3: { side: 'left', lines: ['game', 'designer'] },
}

function themeFor(mode) {
  if (mode === 1 || mode === 3) return 'blue'
  return 'red'
}

function thumbVars(index) {
  const start = MODE_UNITS.slice(0, index).reduce((sum, unit) => sum + unit, 0)
  return {
    '--thumb-start': start,
    '--thumb-span': MODE_UNITS[index],
    '--thumb-total': MODE_TOTAL,
  }
}

function App() {
  const [mode, setMode] = useState(2)
  const cutout = CUTOUTS[mode]
  const theme = themeFor(mode)

  return (
    <main className="stage" data-theme={theme}>
      {theme === 'red' && (
        <h1 className="wordmark" aria-label="jckawin">
          jckawin
        </h1>
      )}

      {cutout && (
        <aside className={`cutout cutout--${cutout.side}`}>
          <p className="cutout-title">
            {cutout.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </aside>
      )}

      <div className="hero">
        <img src={portrait} alt="" className="portrait" />
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
