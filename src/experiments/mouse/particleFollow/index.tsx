import { useEffect, useRef } from 'react'
import type { ComponentType } from 'react'
import type { ExperimentComponentProps } from '@/experiments/shared/types'
import { useAnimationFrame } from '@/experiments/shared/useAnimationFrame'
import { useElementSize } from '@/experiments/shared/useElementSize'
import { usePointerNormalized } from '@/experiments/shared/usePointer'
import { definition } from './meta'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return `rgba(124,108,255,${alpha})`
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}

function Stage({ config, preview }: ExperimentComponentProps) {
  const { ref, size } = useElementSize<HTMLDivElement>()
  const { ref: pointerRef, pos } = usePointerNormalized<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const holding = useRef(false)
  const dprRef = useRef(1)

  const accentColor = String(config.accentColor ?? '#7c6cff')
  const backgroundColor = String(config.backgroundColor ?? '#0a0a18')
  const count = preview
    ? Math.min(Number(config.particleCount ?? 160), 90)
    : Number(config.particleCount ?? 160)

  const setRef = (el: HTMLDivElement | null) => {
    ref.current = el
    pointerRef.current = el
  }

  // click-hold scatters particles outward
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const down = () => {
      holding.current = true
    }
    const up = () => {
      holding.current = false
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  // size the canvas with devicePixelRatio
  useEffect(() => {
    const c = canvasRef.current
    if (!c || !size.width || !size.height) return
    const dpr = preview
      ? Math.min(window.devicePixelRatio || 1, 1.5)
      : Math.min(window.devicePixelRatio || 1, 2)
    dprRef.current = dpr
    c.width = Math.round(size.width * dpr)
    c.height = Math.round(size.height * dpr)
  }, [size, preview])

  useAnimationFrame((dt, elapsed) => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const w = size.width
    const h = size.height
    if (!w || !h) return
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0)

    const particleCount = Math.max(1, Math.round(count))
    const particleSize = Number(config.particleSize ?? 2)
    const particleSpeed = Number(config.particleSpeed ?? 1)
    const attraction = Number(config.attraction ?? 0.6)
    const trailLength = Number(config.trailLength ?? 0.4)
    const connectionDistance = Number(config.connectionDistance ?? 120)

    // target attractor position (px)
    let px: number
    let py: number
    if (preview) {
      const t = elapsed * 0.7
      px = (Math.sin(t) * 0.5 + 0.5) * w
      py = (Math.cos(t * 0.83) * 0.5 + 0.5) * h
    } else {
      px = ((pos.current.x + 1) / 2) * w
      py = ((pos.current.y + 1) / 2) * h
    }

    // keep particle array sized to the configured count
    const arr = particlesRef.current
    while (arr.length < particleCount) {
      arr.push({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0 })
    }
    if (arr.length > particleCount) arr.length = particleCount

    const maxSpeed = 40 + particleSpeed * 140
    const accel = 300 + particleSpeed * 700
    const damping = Math.exp(-(1 - trailLength) * 4 * dt)
    const scatterR = connectionDistance * 0.8

    for (let i = 0; i < arr.length; i++) {
      const p = arr[i]
      const dx = px - p.x
      const dy = py - p.y
      const d = Math.hypot(dx, dy) || 1
      // attraction: accelerate toward pointer
      p.vx += (dx / d) * accel * attraction * dt
      p.vy += (dy / d) * accel * attraction * dt
      // scatter while holding
      if (holding.current && d < scatterR) {
        const f = (1 - d / scatterR) * 900
        p.vx -= (dx / d) * f * dt
        p.vy -= (dy / d) * f * dt
      }
      // friction from trailLength
      p.vx *= damping
      p.vy *= damping
      // clamp speed
      const sp = Math.hypot(p.vx, p.vy)
      if (sp > maxSpeed) {
        p.vx = (p.vx / sp) * maxSpeed
        p.vy = (p.vy / sp) * maxSpeed
      }
      // ambient jitter keeps the field alive
      p.vx += (Math.random() - 0.5) * 30 * dt
      p.vy += (Math.random() - 0.5) * 30 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      // wrap around edges
      if (p.x < -20) p.x = w + 20
      if (p.x > w + 20) p.x = -20
      if (p.y < -20) p.y = h + 20
      if (p.y > h + 20) p.y = -20
    }

    // draw background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, w, h)

    // connection lines between nearby particles
    const cd2 = connectionDistance * connectionDistance
    ctx.lineWidth = preview ? 0.5 : 1
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i]
        const b = arr[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const d2 = dx * dx + dy * dy
        if (d2 < cd2) {
          const alpha = (1 - Math.sqrt(d2) / connectionDistance) * 0.45
          ctx.strokeStyle = hexToRgba(accentColor, alpha)
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }
    }

    // particles
    ctx.fillStyle = accentColor
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i]
      ctx.beginPath()
      ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  return (
    <div
      ref={setRef}
      className="relative w-full h-full"
      style={{ background: backgroundColor, touchAction: 'none' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ cursor: 'crosshair' }} />
    </div>
  )
}

export const Preview: ComponentType<ExperimentComponentProps> = (props) => <Stage {...props} preview />
export const Renderer: ComponentType<ExperimentComponentProps> = (props) => <Stage {...props} preview={false} />

export default { Preview, Renderer }
export { definition }
