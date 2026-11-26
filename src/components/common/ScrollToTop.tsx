import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Scroll the window to the top on every route change (SPA link clicks keep the old scroll otherwise). */
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])
  return null
}
