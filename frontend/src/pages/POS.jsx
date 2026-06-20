import React, { useState, useEffect, useCallback } from 'react'
import { getProducts, getCategories } from '../api/product.api'
import { useCartStore } from '../store/cartStore'
import { useUIStore } from '../store/uiStore'
import ProductCard from '../components/ProductCard'
import Cart from '../components/Cart'
import CheckoutModal from '../components/CheckoutModal'
import ReceiptModal from '../components/ReceiptModal'

export default function POS() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCheckout, setShowCheckout] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const { clearCart } = useCartStore()
  const { addToast } = useUIStore()

  const loadCategories = async () => {
    try {
      const res = await getCategories()
      setCategories(res.data.categories || res.data || [])
    } catch (_) {}
  }

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (activeCategory !== 'all') params.category = activeCategory
      if (searchQuery) params.search = searchQuery
      const res = await getProducts(params)
      setProducts(res.data.products || res.data || [])
    } catch (err) {
      addToast('error', 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [activeCategory, searchQuery])

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300)
    return () => clearTimeout(timer)
  }, [loadProducts])

  const handlePaymentSuccess = (data) => {
    setShowCheckout(false)
    setReceiptData(data)
  }

  const handleNewSale = () => {
    clearCart()
    setReceiptData(null)
    addToast('success', 'New sale started')
  }

  return (
    <div className="pos-layout" style={{ margin: '-24px', height: 'calc(100vh - 0px)' }}>
      {/* Left: Products */}
      <div className="pos-left">
        {/* Search + Category Header */}
        <div style={{ padding: '16px 16px 0', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div className="search-wrapper" style={{ marginBottom: 12 }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              id="pos-search-input"
            />
          </div>
          <div className="pill-tabs">
            <button
              className={`pill-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
              id="category-tab-all"
            >
              🏪 All
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                className={`pill-tab ${activeCategory === cat._id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat._id)}
                id={`category-tab-${cat._id}`}
              >
                {cat.icon || '📦'} {cat.name}
              </button>
            ))}
          </div>
          <div style={{ height: 12 }} />
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12 }}>
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <span style={{ color: 'var(--text-muted)' }}>Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>No products found</div>
            <div style={{ fontSize: 13 }}>Try a different search or category</div>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className="pos-right">
        <Cart onCheckout={() => setShowCheckout(true)} />
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptModal
          paymentData={receiptData}
          onClose={() => setReceiptData(null)}
          onNewSale={handleNewSale}
        />
      )}
    </div>
  )
}
