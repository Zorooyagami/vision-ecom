import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import './Payment.css'

export default function Payment() {
  const { items, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Payment method state
  const [selectedPayment, setSelectedPayment] = useState('card')
  
  // Card form state
  const [form, setForm] = useState({   
    card: '4242 4242 4242 4242',
    expiry: '12/28',
    cvv: '112',
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
    
    // Only validate card details if card payment is selected
    if (selectedPayment === 'card') {
      if (!form.card.trim() || form.card.replace(/\s/g, '').length < 15) {
        next.card = 'Valid card number required'
      }
      if (!form.expiry.trim() || !/^\d{2}\/\d{2}$/.test(form.expiry)) {
        next.expiry = 'Use MM/YY format'
      }
      if (!form.cvv.trim() || form.cvv.length < 3) {
        next.cvv = 'CVV required'
      }
    }
    
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    setProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      
      window.vision?.track('purchase', {
        title: document.title,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        orderId: 'ORD-' + Date.now().toString().slice(-8),
        total: total.toFixed(2),
        email: form.email,
        paymentMethod: selectedPayment, // Added payment method
        products: items.map(item => ({
          productId: item.id,
          productName: item.name,
          productPrice: item.price,
          productQuantity: item.quantity,
        })),
      })  
      
      clearCart()
      navigate('/confirmation', {
        state: {
          orderId: 'ORD-' + Date.now().toString().slice(-8),
          total: total.toFixed(2),
          email: form.email,
          paymentMethod: selectedPayment, // Added payment method
        },
      })
    }, 1500)
  }

  return (
    <div className="payment-page container">
      <h1>Checkout</h1>

      <div className="payment-layout">
        <form className="payment-form card" onSubmit={handleSubmit}>
          <h2 className="section-title">Payment Method</h2>
          
          {/* Payment Method Selection */}
          <div className="payment-methods">
            <div className="payment-option">
              <input
                type="radio"
                id="card"
                name="paymentMethod"
                value="card"
                checked={selectedPayment === 'card'}
                onChange={(e) => {
                  setSelectedPayment(e.target.value)
                  setErrors({})
                }}
              />
              <label htmlFor="card" className="payment-label">
                <span className="payment-icon">💳</span>
                <span>Credit / Debit Card</span>
              </label>
            </div>

            <div className="payment-option">
              <input
                type="radio"
                id="apple-pay"
                name="paymentMethod"
                value="apple-pay"
                checked={selectedPayment === 'apple-pay'}
                onChange={(e) => {
                  setSelectedPayment(e.target.value)
                  setErrors({})
                }}
              />
              <label htmlFor="apple-pay" className="payment-label">
                <span className="payment-icon"><img src="https://img.icons8.com/?size=100&id=62858&format=png&color=000000" /></span>
                <span>Apple Pay</span>
              </label>
            </div>

            <div className="payment-option">
              <input
                type="radio"
                id="google-pay"
                name="paymentMethod"
                value="google-pay"
                checked={selectedPayment === 'google-pay'}
                onChange={(e) => {
                  setSelectedPayment(e.target.value)
                  setErrors({})
                }}
              />
              <label htmlFor="google-pay" className="payment-label">
                <span className="payment-icon"><img src="https://img.icons8.com/?size=100&id=vizert0k77Jn&format=png&color=000000" /></span>
                <span>Google Pay</span>
              </label>
            </div>

            <div className="payment-option">
              <input
                type="radio"
                id="paypal"
                name="paymentMethod"
                value="paypal"
                checked={selectedPayment === 'paypal'}
                onChange={(e) => {
                  setSelectedPayment(e.target.value)
                  setErrors({})
                }}
              />
              <label htmlFor="paypal" className="payment-label">
                <span className="payment-icon"><img src="https://img.icons8.com/?size=100&id=13611&format=png&color=000000" /></span>
                <span>PayPal</span>
              </label>
            </div>
          </div>

          {/* Card Details - Only show when card is selected */}
          {selectedPayment === 'card' && (
            <>
              <p className="demo-note">This is a demo — no real charges will be made.</p>
              
              <div className="form-group">
                <label>Card Number</label>
                <input
                  name="card"
                  value={form.card}
                  onChange={handleChange}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                />
                {errors.card && <span className="error">{errors.card}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry (MM/YY)</label>
                  <input
                    name="expiry"
                    value={form.expiry}
                    onChange={handleChange}
                    placeholder="12/28"
                    maxLength={5}
                  />
                  {errors.expiry && <span className="error">{errors.expiry}</span>}
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    name="cvv"
                    value={form.cvv}
                    onChange={handleChange}
                    placeholder="123"
                    maxLength={4}
                    type="password"
                  />
                  {errors.cvv && <span className="error">{errors.cvv}</span>}
                </div>
              </div>
            </>
          )}

          {/* Other payment methods - Show message when selected */}
          {selectedPayment !== 'card' && (
            <div className="payment-method-message">
              <p>
                You will be redirected to {selectedPayment === 'apple-pay' ? 'Apple Pay' : 
                  selectedPayment === 'google-pay' ? 'Google Pay' : 'PayPal'} to complete your payment.
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary pay-btn"
            disabled={processing}
          >
            {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
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