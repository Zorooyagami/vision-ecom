import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  // Already logged in → redirect
  if (isAuthenticated) {
    navigate(from, { replace: true })
    return null
  }

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))

    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      let result

      if (mode === 'login') {
        result = await login(form.email, form.password)
        console.log("result", result)
      } else {
        result = await register(
          form.name,
          form.email,
          form.password
        )
        console.log("result", result)
      }

      if (result.success) {
        window.vision?.track(mode === 'login' ? 'login' : 'sign_up', {
          title: document.title,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          userId : result.user.userId
      })  
        navigate(from, { replace: true })
      } else {
        setError(result.error || 'Something went wrong')
      }
    } catch (err) {
      console.error('Authentication error:', err)

      setError(
        err.response?.data?.error ||
        'Unable to connect to the server. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')

    setForm({
      name: '',
      email: form.email,
      password: '',
    })
  }

  return (
    <div className="login-page container">
      <div className="login-card card">
        <h1>
          {mode === 'login'
            ? 'Welcome back'
            : 'Create account'}
        </h1>

        <p className="subtitle">
          {mode === 'login'
            ? 'Sign in to continue shopping'
            : 'Join ShopEasy to track orders and more'}
        </p>

        <div className="demo-hint">
          {mode === 'login'
            ? 'Sign in using your ShopEasy account'
            : 'Create a new ShopEasy account'}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete={
                mode === 'login'
                  ? 'current-password'
                  : 'new-password'
              }
              required
              minLength={4}
            />
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary submit-btn"
            disabled={loading}
          >
            {loading
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>

        <p className="switch-mode">
          {mode === 'login' ? (
            <>
              Don’t have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
              >
                Sign in
              </button>
            </>
          )}
        </p>

        <Link to="/" className="back-home">
          ← Back to store
        </Link>
      </div>
    </div>
  )
}