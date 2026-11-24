import { useRef } from 'react'
import type { ComponentType, CSSProperties } from 'react'
import { motion } from 'framer-motion'
import type { ExperimentComponentProps } from '@/experiments/shared/types'
import { useAnimationFrame } from '@/experiments/shared/useAnimationFrame'
import { useElementSize } from '@/experiments/shared/useElementSize'
import { usePointerNormalized } from '@/experiments/shared/usePointer'
import { definition } from './meta'

const THEMES: Record<string, { primary: string; secondary: string; glow: string }> = {
  cyan: { primary: '#38e1ff', secondary: '#3b82f6', glow: '#7ff5ff' },
  violet: { primary: '#7c6cff', secondary: '#c26bff', glow: '#b3a6ff' },
  pink: { primary: '#ff5ea8', secondary: '#ff7ad9', glow: '#ffa6d5' },
  lime: { primary: '#a3e635', secondary: '#34d399', glow: '#d9f99d' },
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

function Blob({ color, className, duration }: { color: string; className: string; duration: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      style={{ background: `radial-gradient(circle at 30% 30%, ${hexToRgba(color, 0.55)}, transparent 70%)` }}
      animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.15, 0.95, 1] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

function Stage({ config, preview }: ExperimentComponentProps) {
  const { ref, size } = useElementSize<HTMLDivElement>()
  const { ref: pointerRef, pos } = usePointerNormalized<HTMLDivElement>()
  const lightRef = useRef<HTMLDivElement>(null)
  const glassRef = useRef<HTMLDivElement>(null)
  const light = useRef({ x: 0, y: 0 })

  const blur = Number(config.blur ?? 16)
  const opacity = Number(config.opacity ?? 0.6)
  const refraction = Number(config.refraction ?? 0.5)
  const borderGlow = Number(config.borderGlow ?? 0.4)
  const distortion = Number(config.distortion ?? 8)
  const tintColor = String(config.tintColor ?? '#7c6cff')
  const theme = String(config.theme ?? 'custom')
  const t = THEMES[theme]
  const primary = t ? t.primary : tintColor
  const secondary = t ? t.secondary : tintColor
  const glow = t ? t.glow : tintColor

  const lightPx = Math.max(120, Math.min(size.width || 300, size.height || 300) * 0.5)

  const setRef = (el: HTMLDivElement | null) => {
    ref.current = el
    pointerRef.current = el
  }

  useAnimationFrame((_dt, elapsed) => {
    const w = size.width || 1
    const h = size.height || 1
    let tx: number
    let ty: number
    if (preview) {
      const s = elapsed * 0.8
      tx = (Math.sin(s) * 0.5 + 0.5) * w
      ty = (Math.cos(s * 0.73) * 0.5 + 0.5) * h
    } else {
      tx = ((pos.current.x + 1) / 2) * w
      ty = ((pos.current.y + 1) / 2) * h
    }
    const LIGHT = Math.max(120, Math.min(w, h) * 0.5)
    light.current.x += (tx - light.current.x) * 0.08
    light.current.y += (ty - light.current.y) * 0.08
    if (lightRef.current) {
      lightRef.current.style.transform = `translate(${light.current.x - LIGHT / 2}px, ${light.current.y - LIGHT / 2}px)`
    }
    if (glassRef.current) {
      const nx = (light.current.x / w) * 2 - 1
      const ny = (light.current.y / h) * 2 - 1
      const skew = distortion * 0.025
      glassRef.current.style.transform = `perspective(900px) rotateX(${-ny * skew}deg) rotateY(${nx * skew}deg)`
    }
  })

  const glassStyle: CSSProperties = {
    background: `rgba(255,255,255,${Math.max(0, opacity) * 0.18})`,
    backdropFilter: `blur(${blur}px) saturate(160%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(160%)`,
    border: `1px solid ${hexToRgba(primary, 0.35)}`,
    boxShadow: `0 12px 40px rgba(0,0,0,0.35), 0 0 ${18 + borderGlow * 48}px ${hexToRgba(glow, borderGlow * 0.6)}`,
    borderRadius: 24,
  }

  const refractionOverlay: CSSProperties = {
    background: `linear-gradient(125deg, ${hexToRgba(primary, refraction * 0.3)} 0%, transparent 45%, ${hexToRgba(secondary, refraction * 0.22)} 100%)`,
    opacity: refraction,
  }

  return (
    <div
      ref={setRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a0a18 0%, #12122b 50%, #0a0a18 100%)' }}
    >
      {/* procedural blobs behind the glass (make the blur visible) */}
      <Blob color={primary} className="w-1/2 h-1/2 -top-10 -left-10" duration={9} />
      <Blob color={secondary} className="w-2/5 h-2/5 bottom-0 right-0" duration={11} />
      <Blob color={glow} className="w-1/3 h-1/3 top-1/3 right-1/4" duration={8} />

      {/* glass panels */}
      <div ref={glassRef} className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
        <div className="relative w-[76%] max-w-md h-[64%] p-6 flex flex-col justify-between" style={glassStyle}>
          <div className="absolute inset-0 rounded-[24px] pointer-events-none" style={refractionOverlay} />
          <div>
            <div className="text-white/90 text-xl font-semibold tracking-wide">液态玻璃</div>
            <div className="text-white/50 text-xs mt-1">Liquid Glass Panel</div>
          </div>
          <div className="relative">
            <div
              className="w-full rounded-xl px-4 py-3 text-white/70 text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${hexToRgba(primary, 0.25)}` }}
            >
              输入一些内容…
            </div>
          </div>
          <div className="flex gap-3">
            <div
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-white"
              style={{ background: hexToRgba(primary, 0.85), boxShadow: `0 4px 16px ${hexToRgba(primary, 0.4)}` }}
            >
              确认
            </div>
            <div
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/80"
              style={{ background: 'rgba(255,255,255,0.1)', border: `1px solid ${hexToRgba(secondary, 0.3)}` }}
            >
              取消
            </div>
          </div>
          <div className="flex gap-2 text-white/40 text-[10px]">
            <span style={{ color: hexToRgba(primary, 0.9) }}>●</span>
            <span>backdrop-filter · blur({blur}px)</span>
          </div>
        </div>
      </div>

      {/* mouse-follow light source that "refracts" over the glass */}
      <div
        ref={lightRef}
        className="pointer-events-none absolute left-0 top-0"
        style={{
          width: lightPx,
          height: lightPx,
          background: `radial-gradient(circle, ${hexToRgba(glow, 0.5)} 0%, ${hexToRgba(primary, 0.18)} 40%, transparent 70%)`,
          mixBlendMode: 'screen',
          filter: 'blur(6px)',
          transform: 'translate(-9999px, -9999px)',
        }}
      />
    </div>
  )
}

export const Preview: ComponentType<ExperimentComponentProps> = (props) => <Stage {...props} preview />
export const Renderer: ComponentType<ExperimentComponentProps> = (props) => <Stage {...props} preview={false} />

export default { Preview, Renderer }
export { definition }
