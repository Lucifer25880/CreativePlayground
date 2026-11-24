import { useEffect, useRef } from 'react'

/** Track pointer position normalized to [-1, 1] within an element. */
export function usePointerNormalized<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const pos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      pos.current = {
        x: ((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1,
        y: ((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1,
      }
    }
    el.addEventListener('pointermove', onMove)
    return () => el.removeEventListener('pointermove', onMove)
  }, [])

  return { ref, pos }
}
