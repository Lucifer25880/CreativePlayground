import { useEffect, useRef } from 'react'

/**
 * requestAnimationFrame loop with delta time (seconds) and elapsed time (seconds).
 * The callback is stored in a ref so it can change identity without restarting the loop.
 */
export function useAnimationFrame(
  callback: (dt: number, elapsed: number) => void,
  running = true,
): void {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!running) return
    let raf = 0
    let last = performance.now()
    const start = last
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      cbRef.current(dt, (now - start) / 1000)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running])
}
