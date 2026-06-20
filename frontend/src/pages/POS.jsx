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
    <div className="flex w-full overflow-hidden bg-[var(--color-bg-primary)]" style={{ margin: '-24px', height: 'calc(100vh - 0px)' }}>
      {/* Left: Products */}
      <div className="flex-[7] flex flex-col min-w-0 border-r border-[var(--color-border-subtle)] h-full overflow-hidden">
        {/* Search + Category Header */}
        <div className="px-4 pt-4 border-b border-[var(--color-border-color)] bg-[var(--color-bg-secondary)]">
          <div className="relative w-full mb-3">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">🔍</span>
            <input
              type="text"
              className="pl-10 h-11 bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              id="pos-search-input"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap cursor-pointer transition-all border border-[var(--color-border-subtle)] ${activeCategory === 'all' ? 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)] text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]' : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white'}`}
              onClick={() => setActiveCategory('all')}
              id="category-tab-all"
            >
              🏪 All
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap cursor-pointer transition-all border border-[var(--color-border-subtle)] ${activeCategory === cat._id ? 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)] text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]' : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white'}`}
                onClick={() => setActiveCategory(cat._id)}
                id={`category-tab-${cat._id}`}
              >
                {cat.icon || '📦'} {cat.name}
              </button>
            ))}
          </div>
          <div className="h-3" />
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex items-center justify-center flex-1 gap-3">
            <span className="inline-block w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-[var(--color-text-muted)]">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="text-[64px] mb-4 opacity-50">📦</div>
            <div className="font-medium text-[var(--color-text-secondary)] mb-1">No products found</div>
            <div className="text-[13px] text-[var(--color-text-muted)]">Try a different search or category</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 md:gap-5 content-start">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className="flex-[3] min-w-[320px] max-w-[400px] h-full flex flex-col bg-[var(--color-bg-secondary)] shrink-0">
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

