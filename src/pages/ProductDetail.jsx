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
      "productId": product.id,
      "name": product.name,
      "price":  product.price,
      "category": product.category,
      "subCategory": product.subCategory,
      "brand": product.brand,
      "color": product.color,
      "rating": product.rating,
      "discount": product.discount,
      "stock": product.stock,
      "tags": product.tags
  });
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
          <img src={product.image} alt={product.name} />
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

          <div className="detail-actions  rr-mask">
            <button
              className="btn btn-primary  rr-mask"
              onClick={addToCartHandler}
            >
              Add to Basket
            </button>
            <Link to="/cart" className="btn btn-outline  rr-mask">
              View Basket
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
