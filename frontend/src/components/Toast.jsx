import React from 'react'
import { useUIStore } from '../store/uiStore'

const icons = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️'
}

const typeColors = {
  success: 'border-l-[var(--color-accent-primary)]',
  error: 'border-l-[var(--color-accent-danger)]',
  info: 'border-l-[var(--color-accent-info)]',
  warning: 'border-l-[var(--color-accent-secondary)]'
}

export default function Toast() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 p-4 min-w-[300px] rounded-xl bg-[rgba(30,41,59,0.85)] backdrop-blur-md border border-[rgba(255,255,255,0.08)] border-l-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto transition-all ${typeColors[toast.type] || 'border-l-[var(--color-border-color)]'}`}
          role="alert"
        >
          <span className="text-xl">{icons[toast.type] || 'ℹ️'}</span>
          <span className="flex-1 text-sm font-medium text-white">{toast.message}</span>
          <button
            className="bg-transparent border-none text-[var(--color-text-secondary)] cursor-pointer text-xl p-1 hover:text-white transition-colors"
            onClick={() => removeToast(toast.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
