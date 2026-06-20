import React from 'react'
import { useCartStore } from '../store/cartStore'

// Map category names to colors and icons
const categoryColors = {
  'Food': { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  'Beverages': { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  'Electronics': { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  'Clothing': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  'Default': { bg: 'rgba(100,116,139,0.2)', color: '#94a3b8' }
}

function getCategoryStyle(categoryName) {
  return categoryColors[categoryName] || categoryColors['Default']
}

function formatLKR(amount) {
  return `Rs. ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StockBadge({ stock }) {
  if (stock === 0) return <span className="badge badge-danger">Out of Stock</span>
  if (stock <= 10) return <span className="badge badge-warning">Low: {stock}</span>
  return <span className="badge badge-success">{stock} in stock</span>
}

export default function ProductCard({ product, adminMode = false, onEdit, onDelete }) {
  const { addItem } = useCartStore()
  const isOutOfStock = product.stock === 0
  const style = getCategoryStyle(product.category?.name || '')

  const handleClick = () => {
    if (isOutOfStock || adminMode) return
    addItem(product)
  }

  return (
    <div
      className={`product-card ${isOutOfStock && !adminMode ? 'out-of-stock' : ''}`}
      onClick={handleClick}
      id={`product-card-${product._id}`}
      style={{ opacity: isOutOfStock && adminMode ? 0.6 : 1 }}
    >
      {adminMode && (
        <div className="product-admin-actions">
          <button
            className="btn-icon"
            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(product) }}
            title="Edit product"
            id={`edit-product-${product._id}`}
          >
            ✏️
          </button>
          <button
            className="btn-icon"
            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(product) }}
            title="Delete product"
            id={`delete-product-${product._id}`}
            style={{ color: 'var(--accent-danger)' }}
          >
            🗑️
          </button>
        </div>
      )}

      <div
        className="product-icon-circle"
        style={{ background: style.bg }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
          />
        ) : (
          <span style={{ fontSize: 24 }}>
            {product.category?.icon || '📦'}
          </span>
        )}
      </div>

      <div>
        <div className="product-name">{product.name}</div>
        {product.sku && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            SKU: {product.sku}
          </div>
        )}
      </div>

      <StockBadge stock={product.stock} />

      <div className="product-price">{formatLKR(product.price)}</div>
    </div>
  )
}
