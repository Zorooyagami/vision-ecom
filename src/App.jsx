import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Payment from './pages/Payment'
import ShippingInfo from './pages/ShippingInfo'
import Confirmation from './pages/Confirmation'
import Login from './pages/Login'
import { useAuth } from './context/AuthContext'
import './App.css'
import { useSessionRecording } from './hooks/useSessionRecording'
// App.jsx — add the route
import SessionReplay from './pages/SessionReplay'
import UserSessions from './pages/UserSessions'
import RecordedUsers from './pages/RecordedUsers'
import HeatmapPages from './pages/HeatmapPages'
import HeatmapView from './pages/HeatmapView'


function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>© 2026 ShopEasy — Demo ecommerce store built with React</p>
      </div>
    </footer>
  )
}

/** Protect routes that require login */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

export default function App() {
    useSessionRecording()
  return (
    <div className="app">
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products-detail/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/replay-test" element={<SessionReplay />} />
          <Route path="/replay/:sessionId" element={<SessionReplay />} />
          <Route path="/user-sessions/:userId" element={<UserSessions />} />
          <Route path="/heatmap-pages" element={<HeatmapPages />} />
          <Route path="/heatmap-view" element={<HeatmapPages />} />
<Route path="/heatmap-view/home" element={<HeatmapView pageType="home" />} />
<Route path="/heatmap-view/products" element={<HeatmapView pageType="products" />} />
<Route path="/heatmap-view/products-detail/:id" element={<HeatmapView pageType="product" />} />
<Route path="/heatmap-view/cart" element={<HeatmapView pageType="cart" />} />
          <Route path="/recorded-users" element={<RecordedUsers />} />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipping-info"
            element={
              <ProtectedRoute>
                <ShippingInfo />
              </ProtectedRoute>
            }
          />
          <Route path="/confirmation" element={<Confirmation />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
