// src/pages/RecordedUsers.jsx — the list view
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = "http://localhost:4000/api/record"

export default function RecordedUsers() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then((r) => r.json())
      .then(setUsers)
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h2>Users with recorded sessions</h2>
      <table>
        <thead>
          <tr><th>User ID</th><th>Sessions</th><th>Last active</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.userId}>
              <td><Link to={`/admin/users/${u.userId}`}>{u.userId}</Link></td>
              <td>{u.sessionCount}</td>
              <td>{new Date(u.lastActivity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}