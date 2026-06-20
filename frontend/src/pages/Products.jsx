import React, { useState, useEffect } from 'react'
import {
  getProducts, getCategories, createProduct, updateProduct,
  deleteProduct, createCategory, updateCategory, deleteCategory
} from '../api/product.api'
import { useUIStore } from '../store/uiStore'
import ProductCard from '../components/ProductCard'

function formatLKR(amount) {
  return `Rs. ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Product Form Modal
function ProductFormModal({ product, categories, onClose, onSave }) {
  const { addToast } = useUIStore()
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category?._id || product?.category || '',
    stock: product?.stock ?? '',
    unit: product?.unit || 'piece',
    sku: product?.sku || '',
    imageUrl: product?.imageUrl || ''
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = 'Valid price required'
    if (!form.category) e.category = 'Category is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) }
      if (product?._id) {
        await updateProduct(product._id, payload)
        addToast('success', 'Product updated successfully')
      } else {
        await createProduct(payload)
        addToast('success', 'Product created successfully')
      }
      onSave()
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const field = (key) => ({
    value: form[key],
    onChange: e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: undefined })) }
  })

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" id="product-form-modal">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)] shrink-0 bg-[var(--color-bg-secondary)]">
          <h3 className="m-0 font-[var(--font-outfit)] text-xl font-bold">{product ? '✏️ Edit Product' : '➕ Add Product'}</h3>
          <button className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white cursor-pointer transition-colors text-lg" onClick={onClose} id="product-form-close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">Name *</label>
                <input className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]" placeholder="Product name" {...field('name')} id="product-name-input" />
                {errors.name && <span className="text-[12px] text-[var(--color-accent-danger)]">{errors.name}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">SKU</label>
                <input className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]" placeholder="SKU-001" {...field('sku')} id="product-sku-input" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">Price (LKR) *</label>
                <input type="number" className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]" placeholder="0.00" step="0.01" min="0" {...field('price')} id="product-price-input" />
                {errors.price && <span className="text-[12px] text-[var(--color-accent-danger)]">{errors.price}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">Category *</label>
                <select className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]" {...field('category')} id="product-category-select">
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                {errors.category && <span className="text-[12px] text-[var(--color-accent-danger)]">{errors.category}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">Stock</label>
                <input type="number" className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]" placeholder="0" min="0" {...field('stock')} id="product-stock-input" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">Unit</label>
                <select className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]" {...field('unit')} id="product-unit-select">
                  <option value="piece">Piece</option>
                  <option value="kg">Kg</option>
                  <option value="g">Grams</option>
                  <option value="liter">Liter</option>
                  <option value="ml">ML</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">Description</label>
                <input className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]" placeholder="Product description (optional)" {...field('description')} id="product-desc-input" />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">Image URL</label>
                <input className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]" placeholder="https://example.com/image.jpg" {...field('imageUrl')} id="product-image-input" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] shrink-0">
            <button type="button" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-bg-hover)] border border-[var(--color-border-color)] text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-colors cursor-pointer" onClick={onClose}>Cancel</button>
            <button type="submit" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-dark)] transition-colors border-none cursor-pointer disabled:opacity-50" disabled={saving} id="product-save-btn">
              {saving ? <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (product ? 'Save Changes' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Delete confirm modal
function DeleteModal({ product, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }
  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" id="delete-product-modal">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)] shrink-0 bg-[var(--color-bg-secondary)]">
          <h3 className="m-0 font-[var(--font-outfit)] text-xl font-bold">🗑️ Delete Product</h3>
          <button className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white cursor-pointer transition-colors text-lg" onClick={onClose}>×</button>
        </div>
        <div className="p-6 overflow-y-auto">
          <p className="text-[var(--color-text-secondary)] m-0">
            Are you sure you want to delete <strong className="text-[var(--color-text-primary)]">{product.name}</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] shrink-0">
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-bg-hover)] border border-[var(--color-border-color)] text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-colors cursor-pointer" onClick={onClose}>Cancel</button>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-accent-danger)] text-white hover:bg-red-600 transition-colors border-none cursor-pointer disabled:opacity-50" onClick={handleConfirm} disabled={loading} id="confirm-delete-btn">
            {loading ? <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Category form modal
function CategoryFormModal({ category, onClose, onSave }) {
  const { addToast } = useUIStore()
  const [name, setName] = useState(category?.name || '')
  const [icon, setIcon] = useState(category?.icon || '📦')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      if (category?._id) {
        await updateCategory(category._id, { name, icon })
        addToast('success', 'Category updated')
      } else {
        await createCategory({ name, icon })
        addToast('success', 'Category created')
      }
      onSave()
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" id="category-form-modal">
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)] shrink-0 bg-[var(--color-bg-secondary)]">
          <h3 className="m-0 font-[var(--font-outfit)] text-xl font-bold">{category ? 'Edit Category' : 'Add Category'}</h3>
          <button className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white cursor-pointer transition-colors text-lg" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto">
            <div className="flex flex-col gap-1.5 mb-3">
              <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">Icon (Emoji)</label>
              <input className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]" value={icon} onChange={e => setIcon(e.target.value)} placeholder="📦" maxLength={4} id="cat-icon-input" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">Name</label>
              <input className="bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]" value={name} onChange={e => setName(e.target.value)} placeholder="Category name" required id="cat-name-input" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] shrink-0">
            <button type="button" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-bg-hover)] border border-[var(--color-border-color)] text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-colors cursor-pointer" onClick={onClose}>Cancel</button>
            <button type="submit" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-dark)] transition-colors border-none cursor-pointer disabled:opacity-50" disabled={saving} id="cat-save-btn">
              {saving ? <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [editProduct, setEditProduct] = useState(null)
  const [deleteProduct_, setDeleteProduct] = useState(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editCategory, setEditCategory] = useState(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const { addToast } = useUIStore()

  const load = async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([getProducts(), getCategories()])
      setProducts(prodRes.data.data?.products || [])
      setCategories(catRes.data.data?.categories || [])
    } catch (_) {
      addToast('error', 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDeleteCategory = async (catId) => {
    try {
      await deleteCategory(catId)
      addToast('success', 'Category deleted')
      load()
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to delete category')
    }
  }

  const handleDeleteProduct = async () => {
    try {
      await deleteProduct(deleteProduct_._id)
      addToast('success', 'Product deleted')
      setDeleteProduct(null)
      load()
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to delete product')
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = activeCategory === 'all' || (p.category?._id === activeCategory || p.category === activeCategory)
    return matchesSearch && matchesCat
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-[var(--font-outfit)] text-[28px] font-bold text-white tracking-tight m-0">📦 Products</h1>
        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-dark)] transition-colors border-none cursor-pointer" onClick={() => setShowAddProduct(true)} id="add-product-btn">
          ➕ Add Product
        </button>
      </div>

      {/* Category Management */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden mb-6">
        <div className="flex justify-between items-center p-4 border-b border-[var(--color-border-subtle)]">
          <span className="font-[var(--font-outfit)] text-[16px] font-bold">🏷️ Categories</span>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg bg-[var(--color-bg-hover)] border border-[var(--color-border-color)] text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-colors cursor-pointer"
              onClick={() => setShowCategories(s => !s)}
              id="toggle-categories-btn"
            >
              {showCategories ? '▲ Hide' : '▼ Show'}
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 text-[13px] font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-dark)] transition-colors border-none cursor-pointer"
              onClick={() => setShowAddCategory(true)}
              id="add-category-btn"
            >
              + Add
            </button>
          </div>
        </div>
        {showCategories && (
          <div className="p-4 flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <span className="text-[13px] text-[var(--color-text-muted)] p-2">No categories yet</span>
            ) : (
              categories.map(cat => (
                <div key={cat._id} className="inline-flex items-center gap-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-color)] rounded-lg px-3 py-2 text-[13px] font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--color-text-muted)] group">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <div className="flex gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="bg-transparent border-none p-0.5 text-[14px] opacity-70 hover:opacity-100 cursor-pointer transition-opacity"
                      onClick={() => setEditCategory(cat)}
                      title="Edit"
                      id={`edit-cat-${cat._id}`}
                    >✏️</button>
                    <button
                      className="bg-transparent border-none p-0.5 text-[14px] opacity-70 hover:opacity-100 cursor-pointer transition-opacity text-[var(--color-accent-danger)]"
                      onClick={() => handleDeleteCategory(cat._id)}
                      title="Delete"
                      id={`delete-cat-${cat._id}`}
                    >🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">🔍</span>
          <input
            className="pl-10 h-11 bg-[var(--color-bg-primary)] text-white border border-[var(--color-border-color)] rounded-[var(--radius-sm)] text-[14px] w-full outline-none transition-all focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] placeholder:text-[var(--color-text-muted)]"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            id="products-search-input"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap cursor-pointer transition-all border border-[var(--color-border-subtle)] ${activeCategory === 'all' ? 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)] text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]' : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white'}`}
            onClick={() => setActiveCategory('all')}
          >All</button>
          {categories.map(cat => (
            <button
              key={cat._id}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap cursor-pointer transition-all border border-[var(--color-border-subtle)] ${activeCategory === cat._id ? 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)] text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]' : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white'}`}
              onClick={() => setActiveCategory(cat._id)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12">
          <span className="inline-block w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="text-[64px] mb-4 opacity-50">📦</div>
          <div className="font-medium text-[var(--color-text-secondary)] mb-1">No products found</div>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-lg bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-dark)] transition-colors border-none cursor-pointer mt-3" onClick={() => setShowAddProduct(true)}>
            Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 md:gap-5">
          {filteredProducts.map(product => (
            <ProductCard
              key={product._id}
              product={product}
              adminMode
              onEdit={setEditProduct}
              onDelete={setDeleteProduct}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddProduct && (
        <ProductFormModal
          categories={categories}
          onClose={() => setShowAddProduct(false)}
          onSave={() => { setShowAddProduct(false); load() }}
        />
      )}
      {editProduct && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          onClose={() => setEditProduct(null)}
          onSave={() => { setEditProduct(null); load() }}
        />
      )}
      {deleteProduct_ && (
        <DeleteModal
          product={deleteProduct_}
          onClose={() => setDeleteProduct(null)}
          onConfirm={handleDeleteProduct}
        />
      )}
      {showAddCategory && (
        <CategoryFormModal
          onClose={() => setShowAddCategory(false)}
          onSave={() => { setShowAddCategory(false); load() }}
        />
      )}
      {editCategory && (
        <CategoryFormModal
          category={editCategory}
          onClose={() => setEditCategory(null)}
          onSave={() => { setEditCategory(null); load() }}
        />
      )}
    </div>
  )
}
