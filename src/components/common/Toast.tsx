import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@/components/common/Icon'

interface ToastState {
  id: number
  message: string
  kind: 'success' | 'error' | 'info'
}

let pushToast: ((message: string, kind?: ToastState['kind']) => void) | null = null

export function toast(message: string, kind: ToastState['kind'] = 'success') {
  pushToast?.(message, kind)
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastState[]>([])

  useEffect(() => {
    pushToast = (message, kind = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, message, kind }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 2600)
    }
    return () => {
      pushToast = null
    }
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm shadow-panel backdrop-blur ${
              t.kind === 'success'
                ? 'border-accent-lime/30 bg-ink-800/90 text-accent-lime'
                : t.kind === 'error'
                  ? 'border-rose-500/30 bg-ink-800/90 text-rose-300'
                  : 'border-white/10 bg-ink-800/90 text-slate-200'
            }`}
          >
            <Icon name={t.kind === 'error' ? 'info' : 'check'} size={15} />
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
