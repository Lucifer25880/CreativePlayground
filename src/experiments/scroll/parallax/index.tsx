import { useRef } from 'react'
import type { UIEvent } from 'react'
import type { ExperimentModule, ExperimentComponentProps } from '@/experiments/shared/types'
import { useAnimationFrame } from '@/experiments/shared/useAnimationFrame'
import { useElementSize } from '@/experiments/shared/useElementSize'
import { usePointerNormalized } from '@/experiments/shared/usePointer'
import { definition } from './meta'

function hueOf(hex: string): number {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (d === 0) return 0
  let hue = 0
  if (max === r) hue = ((g - b) / d) % 6
  else if (max === g) hue = (b - r) / d + 2
  else hue = (r - g) / d + 4
  hue *= 60
  return hue < 0 ? hue + 360 : hue
}

function blobs(accent: string, i: number): string {
  const h = (hueOf(accent) + i * 26) % 360
  return [
    `radial-gradient(circle at ${22 + ((i * 13) % 30)}% ${30 + ((i * 7) % 20)}%, hsla(${h}, 82%, 60%, 0.55), transparent 42%)`,
    `radial-gradient(circle at ${68 + ((i * 9) % 20)}% ${58 + ((i * 11) % 24)}%, hsla(${(h + 120) % 360}, 75%, 48%, 0.4), transparent 45%)`,
  ].join(', ')
}

function stars(accent: string, i: number): string {
  const h = (hueOf(accent) + i * 18) % 360
  const parts: string[] = []
  for (let k = 0; k < 12; k++) {
    const x = (i * 41 + k * 47) % 100
    const y = (i * 73 + k * 31) % 100
    const s = 1 + ((k + i) % 3)
    parts.push(
      `radial-gradient(circle at ${x}% ${y}%, hsl(${(h + k * 20) % 360}, 90%, 72%) ${s}px, transparent ${s + 1}px)`,
    )
  }
  return parts.join(', ')
}

function rings(accent: string, i: number): string {
  const h = (hueOf(accent) + i * 20) % 360
  return `repeating-radial-gradient(circle at 50% 50%, transparent 0 26px, hsla(${h}, 80%, 62%, 0.28) 26px 28px, transparent 28px 56px)`
}

function grid(accent: string, i: number): string {
  const h = (hueOf(accent) + i * 16) % 360
  const line = `hsla(${h}, 80%, 64%, 0.18)`
  return `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`
}

function stripes(accent: string, i: number): string {
  const h = (hueOf(accent) + i * 22) % 360
  return `repeating-linear-gradient(${45 + i * 10}deg, hsla(${h}, 80%, 60%, 0.2) 0 12px, transparent 12px 34px)`
}

function glow(accent: string, i: number): string {
  const h = (hueOf(accent) + i * 12) % 360
  return `radial-gradient(circle at 50% 50%, hsla(${h}, 80%, 58%, 0.5), transparent 62%)`
}

const KINDS = ['blobs', 'stars', 'rings', 'grid', 'stripes', 'glow'] as const

function layerBackground(kind: string, accent: string, i: number): { bg: string; size?: string } {
  switch (kind) {
    case 'stars':
      return { bg: stars(accent, i) }
    case 'rings':
      return { bg: rings(accent, i) }
    case 'grid':
      return { bg: grid(accent, i), size: '46px 46px' }
    case 'stripes':
      return { bg: stripes(accent, i) }
    case 'glow':
      return { bg: glow(accent, i) }
    default:
      return { bg: blobs(accent, i) }
  }
}

function Stage({ config, preview }: ExperimentComponentProps & { preview?: boolean }) {
  const { ref: sizeRef, size } = useElementSize<HTMLDivElement>()
  const { ref: pointerRef, pos } = usePointerNormalized<HTMLDivElement>()
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const progress = useRef(0)
  const target = useRef(0)

  const count = Math.min(7, Math.max(3, Math.round(Number(config.layerCount) || 5)))
  const accent = config.accentColor ?? '#7c6cff'
  const bg = config.backgroundColor ?? '#0a0a18'
  const depth = Number(config.depth)
  const speedMul = Number(config.speedMultiplier)

  const layers = Array.from({ length: count }, (_, i) => {
    const t = count <= 1 ? 0 : i / (count - 1)
    const kind = KINDS[i % KINDS.length]
    const { bg: background, size: backgroundSize } = layerBackground(kind, accent, i)
    return {
      background,
      backgroundSize,
      speed: speedMul * (1 - depth * t),
      opacity: 1 - t * 0.5,
      blur: t * depth * 3,
      z: count - i,
    }
  })

  const setRefs = (el: HTMLDivElement | null) => {
    sizeRef.current = el
    pointerRef.current = el
  }

  useAnimationFrame((dt, elapsed) => {
    if (preview) {
      const period = 7
      const t = (elapsed % period) / period
      target.current = t < 0.5 ? t * 2 : 2 - t * 2
    }
    const k = 1 - Math.exp(-dt / 0.12)
    progress.current += (target.current - progress.current) * k
    const p = progress.current
    const ms = Number(config.mouseSensitivity)
    const vh = size.height || 500
    layers.forEach((layer, i) => {
      const el = layerRefs.current[i]
      if (!el) return
      const ty = -p * vh * 0.5 * layer.speed
      const tx = pos.current.x * 42 * ms * (i + 1)
      const tyy = pos.current.y * 30 * ms * (i + 1)
      el.style.transform = `translate3d(${tx}px, ${ty + tyy}px, 0)`
    })
  })

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    if (max > 0) target.current = Math.min(1, Math.max(0, el.scrollTop / max))
  }

  const viewH = size.height || 480

  return (
    <div
      ref={setRefs}
      onScroll={onScroll}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: bg,
      }}
    >
      <div style={{ height: viewH * 3, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: viewH, width: '100%', overflow: 'hidden' }}>
          {layers.map((layer, i) => (
            <div
              key={i}
              ref={(el) => {
                layerRefs.current[i] = el
              }}
              style={{
                position: 'absolute',
                inset: '-10%',
                background: layer.background,
                backgroundSize: layer.backgroundSize,
                opacity: layer.opacity,
                filter: layer.blur > 0 ? `blur(${layer.blur.toFixed(1)}px)` : undefined,
                zIndex: layer.z,
                willChange: 'transform',
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: count + 1,
              pointerEvents: 'none',
              background: 'radial-gradient(circle at 50% 50%, transparent 45%, rgba(0,0,0,0.55))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: count + 2,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: 8, color: accent, textTransform: 'uppercase' }}>
              Parallax
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 4, marginTop: 6 }}>多层视差</div>
            {!preview && <div style={{ marginTop: 16, fontSize: 13, opacity: 0.6 }}>滚动或移动鼠标</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export const Preview: ExperimentModule['Preview'] = (props) => <Stage {...props} preview />
export const Renderer: ExperimentModule['Renderer'] = (props) => <Stage {...props} preview={false} />

const module: ExperimentModule = { Preview, Renderer }
export default module
export { definition }
