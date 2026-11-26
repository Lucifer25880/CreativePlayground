import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Returns a "go back" handler that uses real browser history (so returning
 * from B goes to wherever the user actually came from, not a hard-coded page),
 * falling back to a sensible route when the page was opened directly.
 */
export function useBack(fallback: string) {
  const navigate = useNavigate()
  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1)
    } else {
      navigate(fallback, { replace: true })
    }
  }, [navigate, fallback])
}
