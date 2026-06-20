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
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" id="product-form-modal">
        <div className="modal-header">
          <h3>{product ? '✏️ Edit Product' : '➕ Add Product'}</h3>
          <button className="btn-icon" onClick={onClose} id="product-form-close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" placeholder="Product name" {...field('name')} id="product-name-input" />
                {errors.name && <span style={{ fontSize: 12, color: 'var(--accent-danger)' }}>{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">SKU</label>
                <input className="form-input" placeholder="SKU-001" {...field('sku')} id="product-sku-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Price (LKR) *</label>
                <input type="number" className="form-input" placeholder="0.00" step="0.01" min="0" {...field('price')} id="product-price-input" />
                {errors.price && <span style={{ fontSize: 12, color: 'var(--accent-danger)' }}>{errors.price}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-input" {...field('category')} id="product-category-select">
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                {errors.category && <span style={{ fontSize: 12, color: 'var(--accent-danger)' }}>{errors.category}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Stock</label>
                <input type="number" className="form-input" placeholder="0" min="0" {...field('stock')} id="product-stock-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-input" {...field('unit')} id="product-unit-select">
                  <option value="piece">Piece</option>
                  <option value="kg">Kg</option>
                  <option value="g">Grams</option>
                  <option value="liter">Liter</option>
                  <option value="ml">ML</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Product description (optional)" {...field('description')} id="product-desc-input" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Image URL</label>
                <input className="form-input" placeholder="https://example.com/image.jpg" {...field('imageUrl')} id="product-image-input" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} id="product-save-btn">
              {saving ? <span className="spinner" /> : (product ? 'Save Changes' : 'Add Product')}
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
    <div className="modal-overlay">
      <div className="modal" id="delete-product-modal">
        <div className="modal-header">
          <h3>🗑️ Delete Product</h3>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{product.name}</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={loading} id="confirm-delete-btn">
            {loading ? <span className="spinner" /> : 'Delete'}
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
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" id="category-form-modal">
        <div className="modal-header">
          <h3>{category ? 'Edit Category' : 'Add Category'}</h3>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Icon (Emoji)</label>
              <input className="form-input" value={icon} onChange={e => setIcon(e.target.value)} placeholder="📦" maxLength={4} id="cat-icon-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Category name" required id="cat-name-input" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} id="cat-save-btn">
              {saving ? <span className="spinner" /> : 'Save'}
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
      setProducts(prodRes.data.products || prodRes.data || [])
      setCategories(catRes.data.categories || catRes.data || [])
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
      <div className="page-header">
        <h1 className="page-title">📦 Products</h1>
        <button className="btn btn-primary" onClick={() => setShowAddProduct(true)} id="add-product-btn">
          ➕ Add Product
        </button>
      </div>

      {/* Category Management */}
      <div className="section-card" style={{ marginBottom: 24 }}>
        <div className="section-card-header">
          <span className="section-card-title">🏷️ Categories</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowCategories(s => !s)}
              id="toggle-categories-btn"
            >
              {showCategories ? '▲ Hide' : '▼ Show'}
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddCategory(true)}
              id="add-category-btn"
            >
              + Add
            </button>
          </div>
        </div>
        {showCategories && (
          <div className="category-list">
            {categories.length === 0 ? (
              <span style={{ fontSize: 13, color: 'var(--text-muted)', padding: 8 }}>No categories yet</span>
            ) : (
              categories.map(cat => (
                <div key={cat._id} className="category-chip">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <div className="category-chip-actions">
                    <button
                      className="category-chip-btn"
                      onClick={() => setEditCategory(cat)}
                      title="Edit"
                      id={`edit-cat-${cat._id}`}
                    >✏️</button>
                    <button
                      className="category-chip-btn"
                      onClick={() => handleDeleteCategory(cat._id)}
                      title="Delete"
                      style={{ color: 'var(--accent-danger)' }}
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
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon">🔍</span>
          <input
            className="form-input search-input"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            id="products-search-input"
          />
        </div>
        <div className="pill-tabs" style={{ flexWrap: 'wrap' }}>
          <button
            className={`pill-tab ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >All</button>
          {categories.map(cat => (
            <button
              key={cat._id}
              className={`pill-tab ${activeCategory === cat._id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat._id)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>No products found</div>
          <button className="btn btn-primary" onClick={() => setShowAddProduct(true)} style={{ marginTop: 12 }}>
            Add First Product
          </button>
        </div>
      ) : (
        <div className="product-grid">
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
