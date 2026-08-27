import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './Cart.css'

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart()

  const triggerCheckoutStart = () => {
    window.vision?.track('checkout_start', {
       title: document.title,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
      products: items,
      totalPrice: totalPrice,
      totalItems: totalItems,
    })
  }
  
  if (items.length === 0) {
    return (
      <div className="cart-page container">
        <h1>Your Basket</h1>
        <div className="empty-cart">
          <span className="empty-icon">🛒</span>
          <h2>Your basket is empty</h2>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }
  window.vision?.track('view_cart', {
     title: document.title,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
      products: items,
      otalPrice: totalPrice,
      totalItems: totalItems,
    })
  return (
    <div className="cart-page container">
      <h1>Your Basket <span className="item-count">({totalItems} items)</span></h1>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map(item => (
            <div key={item.id} className="cart-item card">
              <img src="https://images.pexels.com/photos/325153/pexels-photo-325153.jpeg" alt={item.name} className="cart-item-img" />
              <div className="cart-item-info">
                <Link to={`/products/${item.id}`}>
                  <h3>{item.name}</h3>
                </Link>
                <p className="cart-item-price">${item.price.toFixed(2)}</p>
              </div>
              <div className="cart-item-qty">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1, item)}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <div className="cart-item-total">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
              <button
                className="remove-btn"
                onClick={() => removeFromCart(item.id, item)}
                aria-label="Remove item"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary card">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{totalPrice >= 50 ? 'Free' : '$5.99'}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>
              ${(totalPrice + (totalPrice >= 50 ? 0 : 5.99)).toFixed(2)}
            </span>
          </div>
          <Link to="/shipping-info" onClick={triggerCheckoutStart} className="btn btn-primary checkout-btn">
            Proceed to Payment
          </Link>
          <Link to="/products" className="continue-shopping">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
