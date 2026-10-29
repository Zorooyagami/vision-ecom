import {
  createContext,
  useContext,
  useReducer,
  useEffect,
} from 'react'
import { sessionRecorder } from '../lib/recorder'

const AuthContext = createContext()

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const DEFAULT_PROJECT_ID = 'vis_6bcd1aef732e0d5d'

function getProjectId() {
  return (
    document
      .querySelector('script[data-project-id]')
      ?.getAttribute('data-project-id')
      ?.trim() || DEFAULT_PROJECT_ID
  )
}

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
    case 'LOAD_USER':
      return {
        user: action.payload,
        isAuthenticated: Boolean(action.payload),
        loading: false,
      }

    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        loading: false,
      }

    case 'AUTH_READY':
      return {
        ...state,
        loading: false,
      }

    default:
      return state
  }
}

function flushTracking() {
  // Flush recording events before changing their user/session context.
  try {
    sessionRecorder.stop()
  } catch (error) {
    console.warn('Failed to stop session recording:', error)
  }

  // Queued analytics events retain the identity they had when created.
  try {
    window.vision?.flush?.()
  } catch (error) {
    console.warn('Failed to flush analytics:', error)
  }
}

function clearTrackingSession() {
  const projectId = getProjectId()

  // These keys belong to analytics/recording, not general app storage.
  sessionStorage.removeItem('vision_session_id')
  sessionStorage.removeItem(`rr_context_${projectId}`)

  // Remove session keys created by the earlier recorder implementation.
  const legacyPrefix = `rr_session_id_${projectId}_`

  for (let index = sessionStorage.length - 1; index >= 0; index--) {
    const key = sessionStorage.key(index)

    if (key?.startsWith(legacyPrefix)) {
      sessionStorage.removeItem(key)
    }
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('auth_user')

      dispatch({
        type: 'LOAD_USER',
        payload: saved ? JSON.parse(saved) : null,
      })
    } catch (error) {
      console.error('Failed to load auth:', error)

      try {
        localStorage.removeItem('auth_user')
      } catch {
        // Storage may be unavailable.
      }

      dispatch({ type: 'AUTH_READY' })
    }
  }, [])

  // Another tab can log out or switch accounts. Reload this tab too,
  // so its SDK cannot continue using a stale cached identity.
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.storageArea !== localStorage) return
      if (event.key !== 'auth_user' && event.key !== null) return
      if (event.key === 'auth_user' && event.oldValue === event.newValue) {
        return
      }

      flushTracking()

      try {
        clearTrackingSession()
      } catch (error) {
        console.warn('Failed to clear tracking session:', error)
      }

      window.location.reload()
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Persist immediately instead of waiting for a React effect.
  // This lets subsequent events and recorder calls read the new identity.
  const completeLogin = (user) => {
    const previousUserId = window.vision?.getUserId?.()

    sessionRecorder.stop()

    localStorage.setItem('auth_user', JSON.stringify(user))

    dispatch({
      type: 'LOGIN',
      payload: user,
    })

    // The existing SDK caches a signed-in ID indefinitely.
    // Switching accounts requires a reload until the SDK supports reset.
    if (previousUserId && previousUserId !== user.userId) {
      try {
        window.vision?.flush?.()
        clearTrackingSession()
      } catch (error) {
        console.warn('Failed to reset tracking after account switch:', error)
      }

      window.location.reload()
      return
    }

    // The guest-capable recorder preserves the session on guest → login.
    // Respect visual-picker mode, where recording should remain paused.
    if (!window.vision?.isPickerActive?.()) {
      sessionRecorder.onRouteChange(window.location.pathname)
    }
  }

  const login = async (email, password) => {
    if (!email?.trim() || !password?.trim()) {
      return {
        success: false,
        error: 'Email and password are required',
      }
    }

    if (password.length < 4) {
      return {
        success: false,
        error: 'Password must be at least 4 characters',
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Project-Id': getProjectId(),
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Invalid email or password',
        }
      }

      completeLogin(data)

      return {
        success: true,
        user: data,
      }
    } catch (error) {
      console.error('Login failed:', error)

      return {
        success: false,
        error: 'Unable to complete login. Please try again.',
      }
    }
  }

  const register = async (name, email, password) => {
    if (!name?.trim()) {
      return {
        success: false,
        error: 'Name is required',
      }
    }

    if (!email?.trim()) {
      return {
        success: false,
        error: 'Email is required',
      }
    }

    if (!password?.trim()) {
      return {
        success: false,
        error: 'Password is required',
      }
    }

    if (password.length < 4) {
      return {
        success: false,
        error: 'Password must be at least 4 characters',
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Project-Id': getProjectId(),
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create account',
        }
      }

      completeLogin(data)

      return {
        success: true,
        user: data,
      }
    } catch (error) {
      console.error('Registration failed:', error)

      return {
        success: false,
        error: 'Unable to complete registration. Please try again.',
      }
    }
  }

  const logout = () => {
    // Preserve the identity of events recorded before logout.
    flushTracking()

    try {
      localStorage.removeItem('auth_user')
    } catch (error) {
      console.error('Unable to clear saved login:', error)

      // Do not claim logout succeeded if the stored login remains.
      return {
        success: false,
        error: 'Unable to clear saved login. Please try again.',
      }
    }

    try {
      clearTrackingSession()
    } catch (error) {
      console.warn('Failed to clear tracking session:', error)
    }

    dispatch({ type: 'LOGOUT' })

    // Required for the supplied SDK:
    // clearing storage cannot clear its private cachedUserId.
    // Reload also discards the recorder's in-memory identity.
    window.location.reload()

    return { success: true }
  }

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}