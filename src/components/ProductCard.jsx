import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './ProductCard.css'

export default function ProductCard({ productPosition, product }) {
  const { addToCart } = useCart()

  const productClickHandler = () => {
    

    window.vision?.track('select_item', { 
      title: document.title,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      productId: product.id, 
      position: productPosition });
  }

  const addToCartHandler = () => {
    window.vision?.track('select_item', {
      itemId: product.id,
      itemName: product.name,
      itemPosition: productPosition
    })
     addToCart(product)
  }
  return (
    <div className="product-card card">
      <Link to={`/products-detail/${product.id}`} className="product-image-wrap"
      onClick={productClickHandler}>
        <img src={product.image} alt={product.name} loading="lazy" />
      </Link>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <Link to={`/products-detail/${product.id}`} 
        onClick={productClickHandler}>
          <h3 className="product-name">{product.name} --{productPosition}</h3>
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
