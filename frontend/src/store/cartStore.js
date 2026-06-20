import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [],

  addItem: (product) => {
    const items = get().items
    const existing = items.find(i => i.productId === product._id)
    if (existing) {
      set({
        items: items.map(i =>
          i.productId === product._id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
            : i
        )
      })
    } else {
      set({
        items: [
          ...items,
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            subtotal: product.price
          }
        ]
      })
    }
  },

  removeItem: (productId) =>
    set({ items: get().items.filter(i => i.productId !== productId) }),

  updateQuantity: (productId, quantity) => {
    if (quantity < 1) {
      get().removeItem(productId)
      return
    }
    set({
      items: get().items.map(i =>
        i.productId === productId
          ? { ...i, quantity, subtotal: quantity * i.price }
          : i
      )
    })
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0)
}))
