// useSessionRecording.js
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { sessionRecorder } from '../lib/recorder'

export function useSessionRecording() {
  const location = useLocation()

  useEffect(() => {
    sessionRecorder.onRouteChange(location.pathname)
  }, [location.pathname])

  useEffect(() => {
    return () => sessionRecorder.stop() // safety net on app unmount
  }, [])
}