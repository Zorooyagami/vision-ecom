// useSessionRecording.js
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { sessionRecorder } from '../lib/recorder'
import { useAuth } from '../context/AuthContext'

export function useSessionRecording() {
  const location = useLocation()
  const { user } = useAuth()

  // Re-evaluate on route change AND on login/logout. Before, a logout on the same page
  // kept recording as the old user until the next navigation, and a new login could
  // join the previous session. The recorder reads the user from localStorage, which
  // AuthProvider updates in an effect of the same commit, so wait one tick for it.
  useEffect(() => {
    const t = setTimeout(() => sessionRecorder.onRouteChange(location.pathname), 0)
    return () => clearTimeout(t)
  }, [location.pathname, user])

  useEffect(() => {
    return () => sessionRecorder.stop() // safety net on app unmount
  }, [])
}
