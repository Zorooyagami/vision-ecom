import { useState, useMemo, useEffect } from 'react'
import { products } from '../data/products'
import ProductCard from '../components/ProductCard'
import './Products.css'

export default function Products() {
  const [category, setCategory] = useState('All')
  const [subCategory, setSubCategory] = useState('All')
  const [sort, setSort] = useState('default')

  const categories = useMemo(
    () => ['All', ...new Set(products.map(p => p.category))],
    []
  )

  const subCategories = useMemo(
    () => [
      'All',
      ...new Set(
        products
          .filter(p => category === 'All' || p.category === category)
          .map(p => p.subCategory)
      )
    ],
    [category]
  )

  useEffect(() => {
    if (!subCategories.includes(subCategory)) {
      setSubCategory('All')
    }
  }, [subCategories, subCategory])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const categoryMatch =
        category === 'All' || p.category === category

      const subCategoryMatch =
        subCategory === 'All' || p.subCategory === subCategory

      return categoryMatch && subCategoryMatch
    })

    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating)
    if (sort === 'discount') list.sort((a, b) => b.discount - a.discount)

    return list
  }, [category, subCategory, sort])

  useEffect(() => {
    if (!filtered.length) return


    
    window.vision?.track('view_item_list', {
      itemList: filtered.map((product, index) => ({
        itemId: product.id,
        itemPosition: index + 1
      }))
    })
  }, [filtered, category, subCategory, sort])

  return (
    <div className="products-page">
      <div className="products-header">
        <div>
          <h1>All Products</h1>
          <p>{filtered.length} items</p>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Type</label>
          <select value={subCategory} onChange={e => setSubCategory(e.target.value)}>
            {subCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by</label>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="default">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="discount">Biggest Discount</option>
          </select>
        </div>
      </div>

      <div className="products-grid">
        {filtered.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            productPosition={index + 1}
          />
        ))}
      </div>
    </div>
  )
}
