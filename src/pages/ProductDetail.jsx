import { useParams, Link} from 'react-router-dom'
import { useEffect } from 'react'
import { products } from '../data/products'
import { useCart } from '../context/CartContext'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const product = products.find(p => p.id === Number(id))
  const { addToCart } = useCart()

  useEffect(() => {
    if (!product) return
   

     window.vision?.track('product_view', {
       title: document.title,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      productId: product.id, 
      position: product.id,
      name: product.name,
      category: product.name,
      subCategory :product.name,
      brand: product.brand,
      color: product.color,
      condition : product.condition,
      rating : product.rating,
      tags : product.tags,
    })
  }, [product])

    const addToCartHandler = (e) => {
    // Prevent the click from triggering the Link
    e.preventDefault()
    e.stopPropagation()

    window.vision?.track('add_to_cart', {
      "productId": product.id,
    "price": product.price,
    "source": "product_page",
    "category": product.category,
    "subCategory": product.subCategory
    })

    addToCart(product)
  }

  if (!product) {
    return (
      <div className="container not-found">
        <h2>Product not found</h2>
        <Link to="/products" className="btn btn-primary">Back to Products</Link>
      </div>
    )
  }

  return (
    <div className="product-detail container">
      <Link to="/products" className="back-link">← Back to Products</Link>

      <div className="detail-grid">
        <div className="detail-image  rr-mask">
          <img src="https://images.pexels.com/photos/325153/pexels-photo-325153.jpeg" alt={product.name} />
        </div>

        <div className="detail-info">
          <span className="detail-category">{product.category}</span>
          <h1>{product.name}</h1>
          <div className="detail-rating">
            <span className="stars">★ {product.rating}</span>
            <span className="stock">{product.stock} in stock</span>
          </div>
          <p className="detail-price rr-mask">${product.price.toFixed(2)}</p>
          <p className="detail-desc  rr-mask">{product.description}</p>

          <div className="detail-actions">
  <button
    className="btn btn-primary rr-mask"
    onClick={addToCartHandler}
  >
    Add to Basket
  </button>

  <Link to="/cart" className="btn btn-outline rr-mask">
    View Basket
  </Link>
</div>

{/* Product USPs */}
<div className="product-usps">
  <div className="usp-item">
    <span className="usp-icon">🚚</span>
    <div>
      <strong>Free Shipping</strong>
      <span>On orders over $50</span>
    </div>
  </div>

  <div className="usp-item">
    <span className="usp-icon">✓</span>
    <div>
      <strong>Quality Checked</strong>
      <span>Every product is inspected</span>
    </div>
  </div>

  <div className="usp-item">
    <span className="usp-icon">★</span>
    <div>
      <strong>100% Original Brand</strong>
      <span>Authentic products guaranteed</span>
    </div>
  </div>

  <div className="usp-item">
    <span className="usp-icon">↩</span>
    <div>
      <strong>Easy Returns</strong>
      <span>30-day hassle-free returns</span>
    </div>
  </div>
</div>

{/* Payment Methods */}
<div className="payment-section">
  <h3>Payment Methods</h3>

  <p className="payment-subtitle">
    Secure payments supported
  </p>

  <div className="payment-methods">
    <span className="payment-card">VISA</span>
    <span className="payment-card mastercard">●●</span>
    <span className="payment-card">UPI</span>
    <span className="payment-card">PayPal</span>
    <span className="payment-card">AMEX</span>
  </div>
</div>

{/* Delivery & Security */}
<div className="product-info-box">

  <div className="info-row">
        <span>📦</span>
        <div>
          <strong>Fast Delivery</strong>
          <p>Estimated delivery within 3–5 business days.</p>
        </div>
      </div>



  <div className="info-row">
    <span>🔒</span>
    <div>
      <strong>Secure Checkout</strong>
      <p>Your payment information is encrypted and secure.</p>
    </div>
  </div>

      
      <div className="info-row">
        <span>↩️</span>
        <div>
          <strong>30-Day Returns</strong>
          <p>Return your product within 30 days of delivery.</p>
        </div>
      </div>
    </div>

{/* Social / Engagement */}
    <div className="social-section">
      <h3>Share this product</h3>

      <div className="social-icons">
        <button className="social-icon" aria-label="Share on Facebook">
          f
        </button>

        <button className="social-icon" aria-label="Share on Instagram">
          ◎
        </button>

        <button className="social-icon" aria-label="Share on X">
          𝕏
        </button>

        <button className="social-icon" aria-label="Share on WhatsApp">
          ☎
        </button>

        <button className="social-icon" aria-label="Copy product link">
          🔗
        </button>
      </div>
    </div>
        </div>
      </div>
    </div>
  )
}
