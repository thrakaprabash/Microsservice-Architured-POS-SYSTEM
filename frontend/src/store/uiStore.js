import { create } from 'zustand'

let nextId = 1

export const useUIStore = create((set, get) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = nextId++
    const toast = { id, type, message }
    set({ toasts: [...get().toasts, toast] })
    setTimeout(() => {
      get().removeToast(id)
    }, 3000)
    return id
  },

  removeToast: (id) =>
    set({ toasts: get().toasts.filter(t => t.id !== id) })
}))
