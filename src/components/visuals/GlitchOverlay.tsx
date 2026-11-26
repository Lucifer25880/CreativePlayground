import { useEffect, useRef } from 'react'

/**
 * Full-screen CRT "signal loss" glitch: random static that flickers a few times.
 * Used when rewinding to snap the scene back without a reverse animation.
 */
export function GlitchOverlay({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 220
    const H = 124
    canvas.width = W
    canvas.height = H

    let raf = 0
    let last = 0
    const draw = (t: number) => {
      if (t - last > 40) {
        last = t
        const img = ctx.createImageData(W, H)
        const d = img.data
        for (let i = 0; i < d.length; i += 4) {
          const v = Math.random() * 255
          d[i] = v
          d[i + 1] = v
          d[i + 2] = v
          d[i + 3] = 255
        }
        ctx.putImageData(img, 0, 0)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-[58] h-full w-full opacity-50 mix-blend-screen"
      style={{ imageRendering: 'pixelated', animation: 'glitch-flicker 0.5s steps(1) infinite' }}
      aria-hidden="true"
    />
  )
}
