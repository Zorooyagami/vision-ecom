import { Link } from 'react-router-dom'
import { products } from '../data/products'
import ProductCard from '../components/ProductCard'
import './Home.css'

export default function Home() {
  const featured = products.slice(0, 4)

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="container hero-content">
          <h1>Discover products you'll love</h1>
          <p>
            Shop curated electronics, fashion, home essentials and more.
            Fast shipping and easy returns.
          </p>
          <Link to="/products" className="btn btn-primary hero-btn">
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured */}
      <section className="container section">
        <div className="section-header">
          <h2>Featured Products</h2>
          <Link to="/products" className="view-all">View all →</Link>
        </div>
        <div className="products-grid">
          {featured.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="benefits">
        <div className="container benefits-grid">
          <div className="benefit">
            <span className="benefit-icon">🚚</span>
            <h3>Free Shipping</h3>
            <p>On orders over $50</p>
          </div>
          <div className="benefit">
            <span className="benefit-icon">↩️</span>
            <h3>Easy Returns</h3>
            <p>30-day return policy</p>
          </div>
          <div className="benefit">
            <span className="benefit-icon">🔒</span>
            <h3>Secure Payment</h3>
            <p>100% secure checkout</p>
          </div>
          <div className="benefit">
            <span className="benefit-icon">💬</span>
            <h3>24/7 Support</h3>
            <p>We're here to help</p>
          </div>
        </div>
      </section>
    </div>
  )
}
