import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { totalItems } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">🛍️</span>
          Vision E-Com
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
          {/* <NavLink to="/recorded-users" end className={({ isActive }) => isActive ? 'active' : ''}>
            RRWEB
          </NavLink>
          <NavLink to="/heatmap-pages" end className={({ isActive }) => isActive ? 'active' : ''}>
            HeatMap
          </NavLink> */}
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            Home
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
            Products
          </NavLink>
          <NavLink to="/cart" className={({ isActive }) => isActive ? 'active cart-link' : 'cart-link'}>
            Basket
            {totalItems > 0 && <span className="badge">{totalItems}</span>}
          </NavLink>

          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-name">Hi, {user.name}</span>
              <button type="button" className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
