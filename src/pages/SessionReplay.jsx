// src/pages/SessionReplay.jsx
import { useEffect, useRef, useState } from 'react'
import 'rrweb-player/dist/style.css'
import rrwebPlayer from 'rrweb-player'
import { useParams } from 'react-router-dom'

export default function SessionReplay() {
const { sessionId } = useParams()
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const [status, setStatus] = useState('loading') // loading | ready | error | empty
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  const API_BASE = `${API_BASE_URL}/api/record`;

  useEffect(() => {
    let cancelled = false

    fetch(`${API_BASE}/${sessionId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Status ${r.status}`)
        return r.json()
      })
      .then(({ events }) => {
        if (cancelled) return
        if (!events || events.length === 0) {
          setStatus('empty')
          return
        }
        playerRef.current = new rrwebPlayer({
          target: containerRef.current,
          props: {
            events,
            width: 1000,
            height: 600,
            autoPlay: false,
          },
        })
        setStatus('ready')
      })
      .catch((err) => {
        console.error('[SessionReplay] failed to load:', err)
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      playerRef.current?.$destroy?.() // rrweb-player is Svelte-based internally, this tears it down cleanly
    }
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h2>Session Replay — {sessionId}</h2>
      {status === 'loading' && <p>Loading session…</p>}
      {status === 'empty' && <p>No events found for this session.</p>}
      {status === 'error' && <p>Failed to load replay — check console/network tab.</p>}
      <div ref={containerRef} />
    </div>
  )
}