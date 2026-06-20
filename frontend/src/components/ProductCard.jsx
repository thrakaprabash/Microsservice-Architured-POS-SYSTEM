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
  const baseClasses = "w-full text-center py-1.5 text-xs font-bold rounded-full transition-all text-white"
  if (stock === 0) {
    return <div className={`${baseClasses} bg-[var(--color-accent-danger)] shadow-[0_4px_12px_rgba(239,68,68,0.25)]`}>Out of Stock</div>
  }
  if (stock <= 10) {
    return <div className={`${baseClasses} bg-[var(--color-accent-secondary)] shadow-[0_4px_12px_rgba(245,158,11,0.25)]`}>Low Stock: {stock}</div>
  }
  return <div className={`${baseClasses} bg-[var(--color-accent-primary)] shadow-[0_4px_12px_rgba(16,185,129,0.25)]`}>{stock} in stock</div>
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
      className={`flex flex-col gap-3 p-4 bg-[var(--color-bg-card)] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all relative group ${
        isOutOfStock && !adminMode
          ? 'opacity-50 grayscale cursor-not-allowed'
          : 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
      }`}
      onClick={handleClick}
      id={`product-card-${product._id}`}
      style={{ opacity: isOutOfStock && adminMode ? 0.6 : undefined }}
    >
      {adminMode && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[rgba(30,41,59,0.85)] backdrop-blur-md p-1 rounded-lg border border-[var(--color-border-subtle)] z-10">
          <button
            className="p-2 rounded-[var(--radius-sm)] bg-transparent border border-[var(--color-border-color)] text-[var(--color-text-secondary)] cursor-pointer transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(product) }}
            title="Edit product"
            id={`edit-product-${product._id}`}
          >
            ✏️
          </button>
          <button
            className="p-2 rounded-[var(--radius-sm)] bg-transparent border border-[var(--color-border-color)] cursor-pointer transition-colors hover:bg-[var(--color-bg-hover)] hover:text-white text-[var(--color-accent-danger)]"
            onClick={(e) => { e.stopPropagation(); onDelete && onDelete(product) }}
            title="Delete product"
            id={`delete-product-${product._id}`}
          >
            🗑️
          </button>
        </div>
      )}

      <div
        className="w-[80px] h-[80px] rounded-[var(--radius-md)] flex items-center justify-center mx-auto mb-2 shrink-0 overflow-hidden"
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
        <div className="font-semibold text-sm leading-snug">{product.name}</div>
        {product.sku && (
          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            SKU: {product.sku}
          </div>
        )}
      </div>

      <StockBadge stock={product.stock} />

      <div className="text-lg font-bold text-[var(--color-accent-primary)] mt-auto font-[var(--font-outfit)]">{formatLKR(product.price)}</div>
    </div>
  )
}
