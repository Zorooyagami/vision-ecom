// src/pages/HeatmapPages.jsx
import { Link } from 'react-router-dom'

const PAGE_OPTIONS = [
  { pageId: 0, label: 'Home', href: '/heatmap-view/home' },
  { pageId: 1, label: 'Products (PLP)', href: '/heatmap-view/products' },
  { pageId: 2, label: 'Product Detail (PDP)', href: '/heatmap-view/products-detail/1' }, // real product id in the URL
  { pageId: 3, label: 'Cart', href: '/heatmap-view/cart' },
]

export default function HeatmapPages() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Heatmaps</h2>
      <ul>
        {PAGE_OPTIONS.map((p) => (
          <li key={p.pageId}>
            <Link to={p.href}>{p.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}