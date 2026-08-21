// src/pages/HeatmapView.jsx
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import ProductDetail from './ProductDetail'
// import Home from './Home'
// import ProductList from './ProductList'
// import Cart from './Cart'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const API_BASE = `${API_BASE_URL}/api/events/heatmaps`
const GRID = 50

// maps this component's pageType prop -> the numeric pageId your endpoint expects
const PAGE_ID_MAP = {
  home: 0,
  products: 1,
  product: 2,
  cart: 3,
}

export default function HeatmapView({ pageType }) {
  const { id } = useParams() // only populated on the /heatmap-view/product/:id route
  const pageId = PAGE_ID_MAP[pageType]

  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('loading')
  const [eventType, setEventType] = useState('click')
  const [rawEvents, setRawEvents] = useState([])

  useEffect(() => {
    setStatus('loading')
    fetch(`${API_BASE}/${pageId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Status ${r.status}`)
        return r.json()
      })
      .then(({ events }) => {
        setRawEvents(events || [])
        setStatus(events && events.length > 0 ? 'ready' : 'empty')
      })
      .catch((err) => {
        console.error('[HeatmapView] fetch failed:', err)
        setStatus('error')
      })
  }, [pageId])

  useEffect(() => {
    if (status !== 'ready') return
    render()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, eventType, rawEvents])

  function bucket(events, type) {
    const grid = {}
    let max = 0
    events
      .filter((e) => e.event === `heatmap_${type}`)
      .forEach((e) => {
        const x = e.properties?.x
        const y = e.properties?.y
        if (x == null || y == null) return
        const gx = Math.min(GRID - 1, Math.max(0, Math.floor(x * GRID)))
        const gy = Math.min(GRID - 1, Math.max(0, Math.floor(y * GRID)))
        const key = `${gx}_${gy}`
        grid[key] = (grid[key] || 0) + 1
        if (grid[key] > max) max = grid[key]
      })
    return { grid, max }
  }

  function colorFor(t) {
    const stops = [
      [0.0, [59, 130, 246, 0]],
      [0.15, [59, 130, 246, 140]],
      [0.35, [34, 211, 238, 190]],
      [0.55, [74, 222, 128, 210]],
      [0.72, [253, 224, 71, 230]],
      [0.85, [249, 115, 22, 240]],
      [1.0, [239, 68, 68, 255]],
    ]
    for (let i = 0; i < stops.length - 1; i++) {
      const [t0, c0] = stops[i], [t1, c1] = stops[i + 1]
      if (t >= t0 && t <= t1) {
        const f = (t - t0) / (t1 - t0)
        return c0.map((v, idx) => Math.round(v + (c1[idx] - v) * f))
      }
    }
    return stops[stops.length - 1][1]
  }

  function render() {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return

    const w = stage.offsetWidth
    const h = stage.offsetHeight
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    const { grid, max } = bucket(rawEvents, eventType)
    ctx.clearRect(0, 0, w, h)
    if (max === 0) return

    const cellW = w / GRID, cellH = h / GRID
    const off = document.createElement('canvas')
    off.width = w; off.height = h
    const octx = off.getContext('2d')

    Object.entries(grid).forEach(([key, val]) => {
      const [gx, gy] = key.split('_').map(Number)
      const cx = (gx + 0.5) * cellW, cy = (gy + 0.5) * cellH
      const intensity = val / max
      const radius = cellW * 2.6
      const g = octx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      g.addColorStop(0, `rgba(0,0,0,${0.35 * intensity})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      octx.fillStyle = g
      octx.beginPath()
      octx.arc(cx, cy, radius, 0, Math.PI * 2)
      octx.fill()
    })

    const imgData = octx.getImageData(0, 0, w, h)
    const data = imgData.data
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255
      if (alpha <= 0.02) continue
      const [r, g, b, a] = colorFor(Math.min(1, alpha * 2.4))
      data[i] = r; data[i + 1] = g; data[i + 2] = b
      data[i + 3] = Math.min(255, a * Math.min(1, alpha * 3))
    }
    octx.putImageData(imgData, 0, 0)

    ctx.globalAlpha = 0.82
    ctx.drawImage(off, 0, 0)
    ctx.globalAlpha = 1
  }

  function renderPageContent() {
    if (pageType === 'product') return <ProductDetail />
    // if (pageType === 'home') return <Home />
    // if (pageType === 'products') return <ProductList />
    // if (pageType === 'cart') return <Cart />
    return <p>Page content not wired up yet for "{pageType}"</p>
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Heatmap — {pageType}{id ? ` (product ${id})` : ''}</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setEventType('move')} disabled={eventType === 'move'}>Moves</button>{' '}
        <button onClick={() => setEventType('click')} disabled={eventType === 'click'}>Clicks</button>
      </div>

      {status === 'loading' && <p>Loading…</p>}
      {status === 'error' && <p>Failed to load heatmap data.</p>}
      {status === 'empty' && <p>No events captured for this page yet.</p>}

      {status === 'ready' && (
        <main ref={stageRef} style={{ position: 'relative', display: 'inline-block' }}>
            {renderPageContent()}
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
            </main>
      )}
    </div>
  )
}