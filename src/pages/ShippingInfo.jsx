import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import './Payment.css'

export default function Payment() {
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: 'test test',
    city: 'Mumbai',
    zip: '400001',
  })
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)

  const shipping = totalPrice >= 50 ? 0 : 5.99
  const total = totalPrice + shipping

  if (items.length === 0) {
    return (
      <div className="payment-page container">
        <div className="empty-state">
          <h2>No items to checkout</h2>
          <Link to="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) next.email = 'Valid email required'
    if (!form.address.trim()) next.address = 'Address is required'
    if (!form.city.trim()) next.city = 'City is required'
    if (!form.zip.trim()) next.zip = 'ZIP is required'
    
    // Set errors
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!validate()) return

    setProcessing(true)

    try {
      // Calculate total items count
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

      // Track shipping details event
      if (window.vision?.track) {
        window.vision.track('shipping_details', {
          title: document.title,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          products: items,
          totalPrice: totalPrice,
          totalItems: totalItems,
          shippingDetails: {
            name: form.name,
            email: form.email,
            address: form.address,
            city: form.city,
            zip: form.zip
          }
        })
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Navigate to success/confirmation page
      // Option 1: Navigate to an order confirmation page
      navigate('/payment')


    } catch (error) {
      console.error('Payment processing error:', error)
      setProcessing(false)
      // Show error message to user
      alert('There was an error processing your order. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="payment-page container">
      <h1>Checkout</h1>

      <div className="payment-layout">
        <form className="payment-form card" onSubmit={handleSubmit}>
          <h2>Shipping Details</h2>
          <div className="form-row">
            <div className="form-group rr-mask">
              <label>Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                disabled={processing}
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>
            <div className="form-group rr-mask">
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@example.com"
                disabled={processing}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>
          </div>
          <div className="form-group rr-mask">
            <label>Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="123 Main St"
              disabled={processing}
            />
            {errors.address && <span className="error">{errors.address}</span>}
          </div>
          <div className="form-row ">
            <div className="form-group rr-mask">
              <label>City</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="New York"
                disabled={processing}
              />
              {errors.city && <span className="error">{errors.city}</span>}
            </div>
            <div className="form-group rr-mask">
              <label>ZIP Code</label>
              <input
                name="zip"
                value={form.zip}
                onChange={handleChange}
                placeholder="10001"
                disabled={processing}
              />
              {errors.zip && <span className="error">{errors.zip}</span>}
            </div>
          </div>          

          <button
            type="submit"
            className="btn btn-primary pay-btn"
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Place Order'}
          </button>
        </form>

        <div className="order-summary card">
          <h2>Order Summary</h2>
          <ul className="summary-items">
            {items.map(item => (
              <li key={item.id}>
                <span>{item.name} × {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}