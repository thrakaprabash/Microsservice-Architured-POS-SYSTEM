import React from 'react'
import { useUIStore } from '../store/uiStore'

const icons = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️'
}

export default function Toast() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          role="alert"
        >
          <span className="toast-icon">{icons[toast.type] || 'ℹ️'}</span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
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
