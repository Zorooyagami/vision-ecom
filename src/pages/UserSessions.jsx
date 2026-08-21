// src/pages/UserSessions.jsx — sessions for one user, then replay on click
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const API_BASE = `${API_BASE_URL}/api/record`

export default function UserSessions() {
  const { userId } = useParams()
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    fetch(`${API_BASE}/users/${userId}/sessions`)
      .then((r) => r.json())
      .then(setSessions)
  }, [userId])

  return (
    <div style={{ padding: 24 }}>
      <h2>Sessions — {userId}</h2>
      {sessions.map((s) => (
        <div key={s.sessionId} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 8 }}>
          <div>{new Date(s.createdAt).toLocaleString()} — {s.pages.join(' → ')}</div>
          <Link to={`/replay/${s.sessionId}`}>Watch replay →</Link>
        </div>
      ))}
    </div>
  )
}