import { useEffect, useRef } from 'react'
import type { ComponentType } from 'react'
import type { ExperimentComponentProps } from '@/experiments/shared/types'
import { useAnimationFrame } from '@/experiments/shared/useAnimationFrame'
import { useElementSize } from '@/experiments/shared/useElementSize'
import { usePointerNormalized } from '@/experiments/shared/usePointer'
import { definition } from './meta'

interface Offset {
  x: number
  y: number
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
  const elementsRef = useRef<(HTMLDivElement | null)[]>([])
  const offsetsRef = useRef<Offset[]>([])
  const velsRef = useRef<Offset[]>([])
  const positionsRef = useRef<Offset[]>([])

  const attractionRadius = Number(config.attractionRadius ?? 150)
  const magneticStrength = Number(config.magneticStrength ?? 0.5)
  const elasticity = Number(config.elasticity ?? 0.6)
  const transitionSpeed = Number(config.transitionSpeed ?? 0.2)
  const elementCount = Math.max(1, Math.min(12, Math.round(Number(config.elementCount ?? 6))))
  const accentColor = String(config.accentColor ?? '#7c6cff')

  const setRef = (el: HTMLDivElement | null) => {
    ref.current = el
    pointerRef.current = el
  }

  // grid layout geometry (used for both rendering and the RAF centers)
  const cw = 92
  const ch = 60
  const gap = 20
  const cols = Math.max(1, Math.ceil(Math.sqrt(elementCount)))
  const rows = Math.max(1, Math.ceil(elementCount / cols))
  const gridW = cols * cw + (cols - 1) * gap
  const gridH = rows * ch + (rows - 1) * gap
  const startX = ((size.width || 0) - gridW) / 2
  const startY = ((size.height || 0) - gridH) / 2
  const positions: Offset[] = []
  for (let i = 0; i < elementCount; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    positions.push({
      x: startX + col * (cw + gap) + cw / 2,
      y: startY + row * (ch + gap) + ch / 2,
    })
  }
  positionsRef.current = positions

  // keep per-element state arrays sized to the count
  useEffect(() => {
    while (offsetsRef.current.length < elementCount) offsetsRef.current.push({ x: 0, y: 0 })
    while (velsRef.current.length < elementCount) velsRef.current.push({ x: 0, y: 0 })
    offsetsRef.current.length = elementCount
    velsRef.current.length = elementCount
    elementsRef.current.length = elementCount
  }, [elementCount])

  useAnimationFrame((dt, elapsed) => {
    const w = size.width
    const h = size.height
    if (!w || !h) return

    let px: number
    let py: number
    if (preview) {
      px = (Math.sin(elapsed * 0.8) * 0.5 + 0.5) * w
      py = (Math.cos(elapsed * 0.63) * 0.5 + 0.5) * h
    } else {
      px = ((pos.current.x + 1) / 2) * w
      py = ((pos.current.y + 1) / 2) * h
    }

    const r = attractionRadius
    const stiffness = 40 + transitionSpeed * 300
    const damping = 2.5 + (1 - elasticity) * 14

    for (let i = 0; i < elementCount; i++) {
      const el = elementsRef.current[i]
      const base = positionsRef.current[i]
      if (!el || !base) continue

      let tx = 0
      let ty = 0
      let hover = 0

      if (preview) {
        // gentle idle wobble so the thumbnail is never static
        const t = elapsed * 1.4 + i * 0.9
        tx = Math.sin(t) * (3 + magneticStrength * 7)
        ty = Math.cos(t * 0.85) * (3 + magneticStrength * 7)
      } else {
        const dx = px - base.x
        const dy = py - base.y
        const d = Math.hypot(dx, dy)
        if (d < r && d > 0.0001) {
          const falloff = Math.pow(1 - d / r, 2)
          const mag = falloff * magneticStrength * (r * 0.55)
          tx = (dx / d) * mag
          ty = (dy / d) * mag
          hover = falloff
        }
      }

      // spring toward the target offset
      const off = offsetsRef.current[i]
      const vel = velsRef.current[i]
      vel.x += ((tx - off.x) * stiffness - vel.x * damping) * dt
      vel.y += ((ty - off.y) * stiffness - vel.y * damping) * dt
      off.x += vel.x * dt
      off.y += vel.y * dt

      const scale = 1 + hover * 0.22
      el.style.transform = `translate(${off.x}px, ${off.y}px) scale(${scale})`
      el.style.boxShadow = `0 ${6 + hover * 12}px ${22 + hover * 22}px ${hexToRgba(accentColor, 0.12 + hover * 0.4)}`
      el.style.filter = `brightness(${1 + hover * 0.4})`
    }
  })

  return (
    <div
      ref={setRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: '#0a0a18', touchAction: 'none' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${hexToRgba(accentColor, 0.08)}, transparent 70%)` }}
      />
      {positions.map((pos, i) => (
        <div
          key={i}
          ref={(el) => {
            elementsRef.current[i] = el
          }}
          className="absolute flex flex-col items-center justify-center gap-1 rounded-2xl"
          style={{
            left: pos.x - cw / 2,
            top: pos.y - ch / 2,
            width: cw,
            height: ch,
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${hexToRgba(accentColor, 0.3)}`,
            color: 'rgba(255,255,255,0.85)',
            fontSize: 13,
            cursor: 'pointer',
            willChange: 'transform',
          }}
        >
          <span style={{ background: accentColor, width: 8, height: 8, borderRadius: 9999 }} />
          <span className="text-xs">{i + 1}</span>
        </div>
      ))}
    </div>
  )
}

export const Preview: ComponentType<ExperimentComponentProps> = (props) => <Stage {...props} preview />
export const Renderer: ComponentType<ExperimentComponentProps> = (props) => <Stage {...props} preview={false} />

export default { Preview, Renderer }
export { definition }
