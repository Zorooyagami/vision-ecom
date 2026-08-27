import { useState, useMemo, useEffect, useRef } from 'react'
import { products } from '../data/products'
import ProductCard from '../components/ProductCard'
import './Products.css'

export default function Products() {
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedSubCategories, setSelectedSubCategories] = useState([])
  const [selectedBrands, setSelectedBrands] = useState([])
  const [selectedConditions, setSelectedConditions] = useState([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity })
  const [sort, setSort] = useState('default')
  const [searchQuery, setSearchQuery] = useState('')
  const [inStock, setInStock] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  
  // Pagination states - Default to 25 items per page
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  
  // Ref to track if initial view_item_list has been sent
  const hasTrackedInitialView = useRef(false)
  const previousFilteredItems = useRef([])
  
  // Ref for search debouncing
  const searchTimeoutRef = useRef(null)

  // Get all unique values for filters
  const allCategories = useMemo(() => 
    [...new Set(products.map(p => p.category))],
    []
  )

  const allSubCategories = useMemo(() => 
    [...new Set(products.map(p => p.subCategory))],
    []
  )

  const allBrands = useMemo(() => 
    [...new Set(products.map(p => p.brand))],
    []
  )

  const allConditions = useMemo(() => 
    [...new Set(products.map(p => p.condition))],
    []
  )

  const maxPrice = useMemo(() => 
    Math.max(...products.map(p => p.price)),
    []
  )

  // Track filter events
  const trackFilterEvent = (filterType, filterValue, action = 'apply') => {
    if (window.vision?.track) {
      window.vision.track('filter_applied', {
        filterType: filterType,
        filterValue: filterValue,
        action: action,
        activeFilters: {
          categories: selectedCategories,
          subCategories: selectedSubCategories,
          brands: selectedBrands,
          conditions: selectedConditions,
          priceRange: {
            min: priceRange.min,
            max: priceRange.max === Infinity ? 'Infinity' : priceRange.max
          },
          inStock: inStock
        },
        totalResults: filtered.length,
        timestamp: new Date().toISOString()
      })
    }
  }

  // Track sort events
  const trackSortEvent = (sortType) => {
    if (window.vision?.track) {
      window.vision.track('sort_changed', {
        sortType: sortType,
        sortLabel: getSortLabel(sortType),
        totalResults: filtered.length,
        timestamp: new Date().toISOString()
      })
    }
  }

  // Get sort label for display
  const getSortLabel = (sortType) => {
    const labels = {
      'default': 'Featured',
      'price-asc': 'Price: Low to High',
      'price-desc': 'Price: High to Low',
      'rating': 'Top Rated',
      'discount': 'Biggest Discount',
      'popular': 'Most Popular'
    }
    return labels[sortType] || sortType
  }

  // Track search events
  const trackSearchEvent = (query, resultsCount) => {
    if (window.vision?.track && query.trim()) {
      window.vision.track('search_performed', {
        searchQuery: query,
        resultsCount: resultsCount,
        timestamp: new Date().toISOString()
      })
    }
  }

  // Handle checkbox changes with tracking
  const handleCheckboxChange = (setter, value, filterType) => {
    // Get the current state value
let currentValues = [];
if (setter === setSelectedCategories) {
  currentValues = selectedCategories;
} else if (setter === setSelectedSubCategories) {
  currentValues = selectedSubCategories;
} else if (setter === setSelectedBrands) {
  currentValues = selectedBrands;
} else if (setter === setSelectedConditions) {
  currentValues = selectedConditions;
}

const isAdding = !currentValues.includes(value);
    
    setter(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
    
    // Track filter event
    setTimeout(() => {
      trackFilterEvent(filterType, value, isAdding ? 'apply' : 'remove')
    }, 100)
    
    // Reset to page 1 when filters change
    setCurrentPage(1)
  }

  // Handle price range changes with tracking
  const handlePriceRangeChange = (type, value) => {
    setPriceRange(prev => {
      const newRange = { ...prev, [type]: value }
      
      // Track price filter
      setTimeout(() => {
        trackFilterEvent('price', {
          min: newRange.min,
          max: newRange.max === Infinity ? 'Infinity' : newRange.max
        }, 'apply')
      }, 300)
      
      return newRange
    })
    setCurrentPage(1)
  }

  // Handle sort change with tracking
  const handleSortChange = (e) => {
    const newSort = e.target.value
    setSort(newSort)
    trackSortEvent(newSort)
    setCurrentPage(1)
  }

  // Handle search with debouncing
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    setCurrentPage(1)
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Debounce search tracking
    if (query.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        const results = products.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.brand.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
        )
        trackSearchEvent(query, results.length)
      }, 500)
    }
  }

  // Track clear all filters
  const handleClearAllFilters = () => {
    if (window.vision?.track) {
      window.vision.track('filters_cleared', {
        previousFilters: {
          categories: selectedCategories,
          subCategories: selectedSubCategories,
          brands: selectedBrands,
          conditions: selectedConditions,
          priceRange: {
            min: priceRange.min,
            max: priceRange.max === Infinity ? 'Infinity' : priceRange.max
          },
          inStock: inStock
        },
        timestamp: new Date().toISOString()
      })
    }
    
    setSelectedCategories([])
    setSelectedSubCategories([])
    setSelectedBrands([])
    setSelectedConditions([])
    setPriceRange({ min: 0, max: Infinity })
    setInStock(false)
    setSearchQuery('')
    setSort('default')
    setCurrentPage(1)
  }

  // Clear all filters
  const clearAllFilters = () => {
    handleClearAllFilters()
  }

  // Filter all products
  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const categoryMatch = selectedCategories.length === 0 || 
        selectedCategories.includes(p.category)

      const subCategoryMatch = selectedSubCategories.length === 0 || 
        selectedSubCategories.includes(p.subCategory)

      const brandMatch = selectedBrands.length === 0 || 
        selectedBrands.includes(p.brand)

      const conditionMatch = selectedConditions.length === 0 || 
        selectedConditions.includes(p.condition)

      const priceMatch = p.price >= priceRange.min && 
        (priceRange.max === Infinity || p.price <= priceRange.max)

      const stockMatch = !inStock || p.stock > 0

      const searchMatch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())

      return categoryMatch && subCategoryMatch && brandMatch && 
             conditionMatch && priceMatch && stockMatch && searchMatch
    })

    // Sorting
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating)
    if (sort === 'discount') list.sort((a, b) => b.discount - a.discount)
    if (sort === 'popular') list.sort((a, b) => b.popular - a.popular)

    return list
  }, [selectedCategories, selectedSubCategories, selectedBrands, 
      selectedConditions, priceRange, inStock, searchQuery, sort])

  // Get current page items
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filtered.slice(startIndex, endIndex)
  }, [filtered, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  // Reset to page 1 when filtered results change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [filtered.length, totalPages])

  // Track view_item_list for current page only
  useEffect(() => {
    if (currentItems.length === 0) return

    // Check if items have changed from previous render
    const currentItemIds = currentItems.map(item => item.id).join(',')
    const previousItemIds = previousFilteredItems.current.map(item => item.id).join(',')

    // Only track if items changed or it's the initial view
    if (currentItemIds !== previousItemIds || !hasTrackedInitialView.current) {
      // Prepare the view_item_list data
      const viewData = {
        title: document.title,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        pageNumber: currentPage,
        itemsPerPage: itemsPerPage,
        totalItems: filtered.length,
        totalPages: totalPages,
        sortBy: sort,
        sortLabel: getSortLabel(sort),
        searchQuery: searchQuery || null,
        activeFilters: {
          categories: selectedCategories,
          subCategories: selectedSubCategories,
          brands: selectedBrands,
          conditions: selectedConditions,
          priceRange: {
            min: priceRange.min,
            max: priceRange.max === Infinity ? 'Infinity' : priceRange.max
          },
          inStock: inStock
        },
        items: currentItems.map((item, index) => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          category: item.category,
          subCategory: item.subCategory,
          price: item.price,
          originalPrice: item.originalPrice,
          discount: item.discount,
          condition: item.condition,
          rating: item.rating,
          stock: item.stock,
          position: ((currentPage - 1) * itemsPerPage) + index + 1,
          pagePosition: index + 1
        }))
      }

      // Track the event
      if (window.vision?.track) {
        window.vision.track('view_item_list', viewData)
        hasTrackedInitialView.current = true
        previousFilteredItems.current = currentItems
      }
    }
  }, [currentItems, currentPage, itemsPerPage, filtered.length, totalPages, 
      sort, searchQuery, selectedCategories, selectedSubCategories, 
      selectedBrands, selectedConditions, priceRange, inStock])

  // Track when items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  // Handle page change
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return
    setCurrentPage(pageNumber)
    // Scroll to top of product grid
    document.querySelector('.products-grid')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    })
    
    // Track page change
    if (window.vision?.track) {
      window.vision.track('page_changed', {
        pageNumber: pageNumber,
        itemsPerPage: itemsPerPage,
        totalPages: totalPages,
        totalItems: filtered.length
      })
    }
  }

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = Number(e.target.value)
    setItemsPerPage(newItemsPerPage)
    
    if (window.vision?.track) {
      window.vision.track('items_per_page_changed', {
        previousItemsPerPage: itemsPerPage,
        newItemsPerPage: newItemsPerPage
      })
    }
  }

  // FIXED: Get page numbers to display - No duplicates
  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i)
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    }

    return rangeWithDots
  }

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedCategories.length) count++
    if (selectedSubCategories.length) count++
    if (selectedBrands.length) count++
    if (selectedConditions.length) count++
    if (priceRange.min > 0 || priceRange.max < maxPrice) count++
    if (inStock) count++
    if (searchQuery) count++
    return count
  }, [selectedCategories, selectedSubCategories, selectedBrands, 
      selectedConditions, priceRange, inStock, searchQuery, maxPrice])

  return (
    <div className="products-page">
      <div className="products-layout">
        {/* Filter Sidebar */}
        <aside className={`filter-sidebar ${!showFilters ? 'hidden' : ''}`}>
          <div className="filter-header">
            <h2>Filters</h2>
            <button 
              className="toggle-filters"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? '✕' : '☰'}
            </button>
          </div>

          <div className="filter-content">
            {/* Search */}
            <div className="filter-section search-section">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>

            {/* Category Filter */}
            <div className="filter-section">
              <h3>Category</h3>
              <div className="filter-options">
                {allCategories.map(category => (
                  <label key={category} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCheckboxChange(setSelectedCategories, category, 'category')}
                    />
                    <span>{category}</span>
                    <span className="count">
                      ({products.filter(p => p.category === category).length})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* SubCategory Filter */}
            <div className="filter-section">
              <h3>Type</h3>
              <div className="filter-options">
                {allSubCategories.map(subCategory => (
                  <label key={subCategory} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedSubCategories.includes(subCategory)}
                      onChange={() => handleCheckboxChange(setSelectedSubCategories, subCategory, 'subCategory')}
                    />
                    <span>{subCategory}</span>
                    <span className="count">
                      ({products.filter(p => p.subCategory === subCategory).length})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="filter-section">
              <h3>Brand</h3>
              <div className="filter-options">
                {allBrands.map(brand => (
                  <label key={brand} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleCheckboxChange(setSelectedBrands, brand, 'brand')}
                    />
                    <span>{brand}</span>
                    <span className="count">
                      ({products.filter(p => p.brand === brand).length})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Condition Filter */}
            <div className="filter-section">
              <h3>Condition</h3>
              <div className="filter-options">
                {allConditions.map(condition => (
                  <label key={condition} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(condition)}
                      onChange={() => handleCheckboxChange(setSelectedConditions, condition, 'condition')}
                    />
                    <span>{condition}</span>
                    <span className="count">
                      ({products.filter(p => p.condition === condition).length})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="filter-section">
              <h3>Price Range</h3>
              <div className="price-range">
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min || ''}
                    onChange={(e) => handlePriceRangeChange('min', e.target.value ? Number(e.target.value) : 0)}
                    min="0"
                    max={maxPrice}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max === Infinity ? '' : priceRange.max}
                    onChange={(e) => handlePriceRangeChange('max', e.target.value ? Number(e.target.value) : Infinity)}
                    min="0"
                    max={maxPrice}
                  />
                </div>
                <div className="price-slider">
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={priceRange.min}
                    onChange={(e) => handlePriceRangeChange('min', Number(e.target.value))}
                    className="slider-min"
                  />
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={priceRange.max === Infinity ? maxPrice : priceRange.max}
                    onChange={(e) => handlePriceRangeChange('max', Number(e.target.value))}
                    className="slider-max"
                  />
                </div>
                <div className="price-labels">
                  <span>${priceRange.min}</span>
                  <span>${priceRange.max === Infinity ? maxPrice : priceRange.max}</span>
                </div>
              </div>
            </div>

            {/* In Stock Filter */}
            <div className="filter-section">
              <label className="filter-option stock-filter">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => {
                    setInStock(e.target.checked)
                    trackFilterEvent('inStock', e.target.checked, 'apply')
                    setCurrentPage(1)
                  }}
                />
                <span>In Stock Only</span>
              </label>
            </div>

            {/* Filter Actions */}
            <div className="filter-actions">
              {activeFilterCount > 0 && (
                <button 
                  className="clear-filters"
                  onClick={clearAllFilters}
                >
                  Clear All ({activeFilterCount})
                </button>
              )}
              <div className="filter-results">
                {filtered.length} results
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="products-main">
          {/* Header */}
          <div className="products-header">
            <div className="header-left">
              <h1>All Products</h1>
              <p className="item-count">{filtered.length} items</p>
            </div>
            <div className="header-right">
              {/* Items per page selector */}
              <select 
                value={itemsPerPage} 
                onChange={handleItemsPerPageChange}
                className="items-per-page-select"
              >
                <option value={12}>12 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>

              {/* Sort */}
              <select 
                value={sort} 
                onChange={handleSortChange}
                className="sort-select"
              >
                <option value="default">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="discount">Biggest Discount</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Active Filters Tags */}
          {activeFilterCount > 0 && (
            <div className="active-filters">
              <span>Active Filters:</span>
              {selectedCategories.map(cat => (
                <span key={cat} className="filter-tag" 
                  onClick={() => handleCheckboxChange(setSelectedCategories, cat, 'category')}>
                  {cat} ×
                </span>
              ))}
              {selectedSubCategories.map(sub => (
                <span key={sub} className="filter-tag"
                  onClick={() => handleCheckboxChange(setSelectedSubCategories, sub, 'subCategory')}>
                  {sub} ×
                </span>
              ))}
              {selectedBrands.map(brand => (
                <span key={brand} className="filter-tag"
                  onClick={() => handleCheckboxChange(setSelectedBrands, brand, 'brand')}>
                  {brand} ×
                </span>
              ))}
              {selectedConditions.map(cond => (
                <span key={cond} className="filter-tag"
                  onClick={() => handleCheckboxChange(setSelectedConditions, cond, 'condition')}>
                  {cond} ×
                </span>
              ))}
              {(priceRange.min > 0 || priceRange.max < maxPrice) && (
                <span className="filter-tag" onClick={() => {
                  setPriceRange({ min: 0, max: Infinity })
                  trackFilterEvent('price', { min: 0, max: 'Infinity' }, 'remove')
                }}>
                  ${priceRange.min} - ${priceRange.max === Infinity ? maxPrice : priceRange.max} ×
                </span>
              )}
              {inStock && (
                <span className="filter-tag" onClick={() => {
                  setInStock(false)
                  trackFilterEvent('inStock', false, 'remove')
                }}>
                  In Stock ×
                </span>
              )}
              {searchQuery && (
                <span className="filter-tag" onClick={() => {
                  setSearchQuery('')
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current)
                  }
                }}>
                  "{searchQuery}" ×
                </span>
              )}
            </div>
          )}

          {/* Products Grid */}
          <div className="products-grid">
            {currentItems.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                productPosition={((currentPage - 1) * itemsPerPage) + index + 1}
                pagePosition={index + 1}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
              />
            ))}
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} items
              </div>
              
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  ‹ Previous
                </button>

                {getPageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">…</span>
                  ) : (
                    <button
                      key={pageNum}
                      className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  )
                ))}

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}