import { createContext, useContext, useReducer, useEffect } from 'react'

const AuthContext = createContext()

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      }

    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        loading: false,
      }

    case 'LOAD_USER':
      return {
        user: action.payload,
        isAuthenticated: !!action.payload,
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

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Load user from localStorage when the app starts
  useEffect(() => {
    try {
      const saved = localStorage.getItem('auth_user')

      if (saved) {
        dispatch({
          type: 'LOAD_USER',
          payload: JSON.parse(saved),
        })
      } else {
        dispatch({ type: 'AUTH_READY' })
      }
    } catch (error) {
      console.error('Failed to load auth:', error)

      localStorage.removeItem('auth_user')

      dispatch({ type: 'AUTH_READY' })
    }
  }, [])

  // Persist user to localStorage
  useEffect(() => {
    if (state.user) {
      localStorage.setItem(
        'auth_user',
        JSON.stringify(state.user)
      )
    } else if (!state.loading) {
      localStorage.removeItem('auth_user')
    }
  }, [state.user, state.loading])

  /**
   * Login
   * POST /api/auth/login
   */
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
      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Invalid email or password',
        }
      }

      dispatch({
        type: 'LOGIN',
        payload: data,
      })

      return {
        success: true,
        user: data,
      }
    } catch (error) {
      console.error('Login failed:', error)

      return {
        success: false,
        error:
          'Unable to connect to the server. Please try again.',
      }
    }
  }

  /**
   * Register
   * POST /api/auth/signup
   */
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
      const PROJECT_ID = "vis_6bcd1aef732e0d5d"

      const response = await fetch(
        `${API_BASE_URL}/api/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Project-Id': PROJECT_ID,
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create account',
        }
      }

      dispatch({
        type: 'LOGIN',
        payload: data,
      })

      return {
        success: true,
        user: data,
      }
    } catch (error) {
      console.error('Registration failed:', error)

      return {
        success: false,
        error:
          'Unable to connect to the server. Please try again.',
      }
    }
  }

  const logout = () => {
    dispatch({ type: 'LOGOUT' })
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
    throw new Error(
      'useAuth must be used within AuthProvider'
    )
  }

  return context
}