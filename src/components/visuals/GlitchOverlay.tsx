import { useEffect, useRef } from 'react'

/**
 * Subtle, LOCALISED CRT signal-lost glitch: a low-opacity dark static band with
 * a couple of thin scanlines near the centre — flashes a few times, then stops.
 */
export function GlitchOverlay({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 240
    const H = 48
    canvas.width = W
    canvas.height = H

    let raf = 0
    let last = 0
    const draw = (t: number) => {
      if (t - last > 50) {
        last = t
        const img = ctx.createImageData(W, H)
        const d = img.data
        for (let i = 0; i < d.length; i += 4) {
          // dark-biased noise so it never blinds the viewer
          const v = Math.random() < 0.1 ? 255 : Math.random() * 36
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
    <div
      className="pointer-events-none fixed inset-0 z-[58] flex flex-col justify-center gap-2 overflow-hidden"
      aria-hidden="true"
    >
      <div className="h-[2px] w-full bg-white/25" style={{ animation: 'glitch-flicker 0.35s steps(1) infinite 0.05s' }} />
      <canvas
        ref={ref}
        className="h-[12%] w-full opacity-30 mix-blend-screen"
        style={{ imageRendering: 'pixelated', animation: 'glitch-flicker 0.45s steps(1) infinite' }}
      />
      <div className="h-[2px] w-full bg-cyan-300/20" style={{ animation: 'glitch-flicker 0.3s steps(1) infinite 0.12s' }} />
    </div>
  )
}
