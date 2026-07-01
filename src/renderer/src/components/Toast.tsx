import React, { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const ToastNotification: React.FC = () => {
  const { toasts, removeToast } = useAppStore()

  return (
    <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none w-80">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  toast: {
    id: string
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  }
  onDismiss: () => void
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const { themeAccent } = useAppStore()

  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500)
    return () => clearTimeout(timer)
  }, [onDismiss])

  // Icon and theme helper
  let Icon = Info
  let accentColor = themeAccent || '#06b6d4'
  let bgGradient = 'from-hud-cyan/10 to-transparent'

  if (toast.type === 'success') {
    Icon = CheckCircle2
    accentColor = '#22c55e'
    bgGradient = 'from-green-500/10 to-transparent'
  } else if (toast.type === 'error') {
    Icon = XCircle
    accentColor = '#ef4444'
    bgGradient = 'from-red-500/10 to-transparent'
  } else if (toast.type === 'warning') {
    Icon = AlertCircle
    accentColor = '#eab308'
    bgGradient = 'from-yellow-500/10 to-transparent'
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="pointer-events-auto glass-panel bg-slate-950/95 p-3 rounded-xl border flex items-center justify-between gap-3 shadow-xl relative overflow-hidden select-text"
      style={{ borderColor: `${accentColor}30` }}
    >
      {/* Decorative linear glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${bgGradient} opacity-20 pointer-events-none`}
      />

      <div className="flex items-center gap-2.5">
        <Icon size={14} style={{ color: accentColor }} className="shrink-0" />
        <span className="text-[10px] font-hud uppercase tracking-wider text-slate-350 leading-snug">
          {toast.message}
        </span>
      </div>

      <button
        onClick={onDismiss}
        className="text-slate-600 hover:text-slate-400 cursor-pointer text-[10px] shrink-0 font-mono"
      >
        ✕
      </button>
    </motion.div>
  )
}
