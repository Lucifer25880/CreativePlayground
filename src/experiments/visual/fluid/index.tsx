import { useEffect, useRef } from 'react'
import type { ComponentType } from 'react'
import { useAnimationFrame } from '@/experiments/shared/useAnimationFrame'
import { useElementSize } from '@/experiments/shared/useElementSize'
import { usePointerNormalized } from '@/experiments/shared/usePointer'
import type { ExperimentComponentProps } from '@/experiments/shared/types'
import { definition } from './meta'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

interface Rgb {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const num = parseInt(full, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

function createParticles(count: number, w: number, h: number): Particle[] {
  const arr: Particle[] = []
  for (let i = 0; i < count; i++) {
    arr.push({
      x: Math.random() * Math.max(1, w),
      y: Math.random() * Math.max(1, h),
      vx: 0,
      vy: 0,
    })
  }
  return arr
}

function Stage(props: ExperimentComponentProps & { preview?: boolean }) {
  const { config, preview = false } = props

  const { ref: sizeRef, size } = useElementSize<HTMLCanvasElement>()
  const { ref: pointerRef, pos } = usePointerNormalized<HTMLDivElement>()

  const particles = useRef<Particle[]>([])
  const dragging = useRef(false)

  // Track drag state for the interaction repulsion (pointerRef targets the wrapper).
  useEffect(() => {
    const el = pointerRef.current
    if (!el) return
    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      dragging.current = true
    }
    const up = () => {
      dragging.current = false
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [])

  // Rebuild particles when count or viewport changes.
  useEffect(() => {
    const count = preview
      ? Math.min(200, Math.max(60, Number(config.particleCount) * 0.4))
      : Number(config.particleCount)
    if (size.width > 0 && size.height > 0) {
      particles.current = createParticles(Math.round(count), size.width, size.height)
    }
  }, [config.particleCount, size.width, size.height, preview])

  const running = size.width > 0 && size.height > 0

  useAnimationFrame((dt, elapsed) => {
    const canvas = sizeRef.current
    if (!canvas || size.width === 0 || size.height === 0) return

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = size.width
    const h = size.height
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Low-alpha trail fade (higher alpha = shorter trails).
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = `rgba(7, 9, 18, ${preview ? 0.3 : 0.12})`
    ctx.fillRect(0, 0, w, h)

    const flowSpeed = Number(config.flowSpeed)
    const turbulence = Number(config.turbulence)
    const viscosity = Number(config.viscosity)
    const interaction = Number(config.interactionStrength)
    const mixing = Number(config.colorMixing)

    const c1 = hexToRgb(String(config.accentColor ?? '#7c6cff'))
    const c2 = hexToRgb(String(config.accentColor2 ?? '#38e1ff'))

    const t = elapsed
    const step = Math.min(1.5, dt * 60)
    const damp = 1 - viscosity * 0.045
    const maxV = 6

    const px = ((pos.current.x + 1) / 2) * w
    const py = ((pos.current.y + 1) / 2) * h
    const interacting = !preview && interaction > 0.01 && dragging.current

    ctx.lineWidth = 1.1
    ctx.lineCap = 'round'

    for (const p of particles.current) {
      // Procedural flow field (sin/cos + pseudo-noise scaled by turbulence).
      const angle =
        Math.sin(p.x * 0.004 + t * 0.5 * flowSpeed) * 1.1 +
        Math.cos(p.y * 0.004 - t * 0.4 * flowSpeed) * 1.1 +
        Math.sin((p.x + p.y) * 0.002) * turbulence * 3 +
        Math.cos(p.x * 0.006 - p.y * 0.005) * turbulence * 2

      p.vx += Math.cos(angle) * 0.5 * flowSpeed * step * 0.14
      p.vy += Math.sin(angle) * 0.5 * flowSpeed * step * 0.14
      p.vx += (Math.random() - 0.5) * turbulence * 0.5
      p.vy += (Math.random() - 0.5) * turbulence * 0.5

      // Viscosity damps velocity.
      p.vx *= damp
      p.vy *= damp

      // Drag repulsion pushes particles outward.
      if (interacting) {
        const dx = p.x - px
        const dy = p.y - py
        const d2 = dx * dx + dy * dy + 1
        const d = Math.sqrt(d2)
        const f = (interaction * 46) / (d2 + 300)
        p.vx += (dx / d) * f * step
        p.vy += (dy / d) * f * step
      }

      // Clamp speed.
      const sp = Math.hypot(p.vx, p.vy)
      if (sp > maxV) {
        const k = maxV / sp
        p.vx *= k
        p.vy *= k
      }

      p.x += p.vx * step
      p.y += p.vy * step

      // Wrap around edges.
      if (p.x < -24) p.x = w + 24
      else if (p.x > w + 24) p.x = -24
      if (p.y < -24) p.y = h + 24
      else if (p.y > h + 24) p.y = -24

      // Blend the two colors by mixing + speed + position.
      const speedMix = clamp01(sp / maxV)
      const posMix = clamp01(0.5 + 0.5 * Math.sin(p.x * 0.01 + p.y * 0.008))
      const mix = clamp01(mixing * (speedMix * 0.6 + posMix * 0.4))
      const r = Math.round(c1.r + (c2.r - c1.r) * mix)
      const g = Math.round(c1.g + (c2.g - c1.g) * mix)
      const b = Math.round(c1.b + (c2.b - c1.b) * mix)

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.85)`
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x - p.vx * 1.6, p.y - p.vy * 1.6)
      ctx.stroke()
    }
  }, running)

  return (
    <div
      ref={pointerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#070912',
        touchAction: 'none',
        cursor: preview ? 'default' : 'crosshair',
      }}
    >
      <canvas
        ref={sizeRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  )
}

export const Preview: ComponentType<ExperimentComponentProps> = (props) => (
  <Stage {...props} preview />
)

export const Renderer: ComponentType<ExperimentComponentProps> = (props) => (
  <Stage {...props} preview={false} />
)

export default { Preview, Renderer }
export { definition }
