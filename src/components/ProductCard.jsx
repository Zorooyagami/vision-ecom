import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './ProductCard.css'

export default function ProductCard({ productPosition = null, product }) {
  const { addToCart } = useCart()

  const productClickHandler = () => {
    

    window.vision?.track('select_item', { 
      title: document.title,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      productId: product.id, 
      position: productPosition,
      name: product.name,
      category: product.name,
      subCategory :product.name,
      brand: product.brand,
      color: product.color,
      condition : product.condition,
      rating : product.rating,
      tags : product.tags,
      price : product.price
 });
  }

  const addToCartHandler = () => {
    window.vision?.track('add_to_cart', {
       title: document.title,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      productId: product.id, 
      position: productPosition,
      name: product.name,
      category: product.name,
      subCategory :product.name,
      brand: product.brand,
      color: product.color,
      condition : product.condition,
      rating : product.rating,
      tags : product.tags,
    })
     addToCart(product)
  }
  return (
    <div className="product-card card">
      <Link to={`/products-detail/${product.id}`} className="product-image-wrap"
      onClick={productClickHandler}>
        <img src="https://images.pexels.com/photos/325153/pexels-photo-325153.jpeg" alt={product.name} loading="lazy" />
      </Link>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <Link to={`/products-detail/${product.id}`} 
        onClick={productClickHandler}>
          <h3 className="product-name">{product.name}</h3>
        </Link>
        <div className="product-meta">
          <span className="product-price">${product.price.toFixed(2)}</span>
          <span className="product-rating">★ {product.rating}</span>
        </div>
        <button
          className="btn btn-primary add-btn"
          onClick={addToCartHandler}
        >
          Add to Basket
        </button>
      </div>
    </div>
  )
}
