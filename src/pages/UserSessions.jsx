// src/pages/UserSessions.jsx — sessions for one user, then replay on click
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_BASE = "http://localhost:4000/api/record"

export default function UserSessions() {
  // const { userId } = useParams()
  let userId = '5ae50b0c3a5b6dfc'
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