import { useRef, useState } from 'react'
import type { ExperimentModule, ExperimentComponentProps } from '@/experiments/shared/types'
import { useAnimationFrame } from '@/experiments/shared/useAnimationFrame'
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

function gradient(hex: string, deg = 135): string {
  const h = hueOf(hex)
  return `linear-gradient(${deg}deg, hsl(${h}, 78%, 52%), hsl(${(h + 70) % 360}, 80%, 20%))`
}

function Label({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: 6 }}>{title}</div>
      <div style={{ fontSize: 13, opacity: 0.75, letterSpacing: 3, marginTop: 10 }}>{subtitle}</div>
    </div>
  )
}

function Stage({ config, preview }: ExperimentComponentProps & { preview?: boolean }) {
  const filterId = useRef('lm-' + Math.random().toString(36).slice(2, 8)).current
  const dispRef = useRef<SVGFEDisplacementMapElement>(null)
  const blurRef = useRef<SVGFEGaussianBlurElement>(null)
  const bRef = useRef<HTMLDivElement>(null)
  const anim = useRef({ t: 0, dir: 1, playing: false, loop: false })
  const [playing, setPlaying] = useState(false)

  const dir = String(config.direction ?? 'forward')
  const duration = Number(config.transitionDuration)
  const strength = Number(config.distortionStrength)
  const turbulence = Number(config.turbulence)
  const blurAmt = Number(config.blurAmount)
  const accent = config.accentColor ?? '#7c6cff'
  const bColor = config.sceneBColor ?? '#ff5ca8'
  const baseFreq = (0.004 + turbulence * 0.028).toFixed(4)

  const applyFilter = () => {
    const t = anim.current.t
    const env = Math.sin(Math.PI * t)
    dispRef.current?.setAttribute('scale', String(strength * env))
    blurRef.current?.setAttribute('stdDeviation', String(blurAmt * env))
    if (bRef.current) bRef.current.style.opacity = String(t)
  }

  useAnimationFrame((dt) => {
    if (preview) {
      if (!anim.current.playing) {
        anim.current.playing = true
        anim.current.loop = true
        anim.current.dir = 1
        setPlaying(true)
      }
    }
    if (!anim.current.playing) return
    const speed = 1 / Math.max(0.05, duration)
    anim.current.t += anim.current.dir * speed * dt
    if (anim.current.t >= 1) {
      anim.current.t = 1
      if (anim.current.loop) anim.current.dir = -1
      else {
        anim.current.playing = false
        setPlaying(false)
      }
    } else if (anim.current.t <= 0) {
      anim.current.t = 0
      if (anim.current.loop) anim.current.dir = 1
      else {
        anim.current.playing = false
        setPlaying(false)
      }
    }
    applyFilter()
  })

  const play = () => {
    const a = anim.current
    if (a.playing && dir === 'loop') {
      a.playing = false
      setPlaying(false)
      return
    }
    if (dir === 'forward') {
      a.t = 0
      a.dir = 1
      a.loop = false
      a.playing = true
    } else if (dir === 'reverse') {
      a.t = 1
      a.dir = -1
      a.loop = false
      a.playing = true
    } else {
      a.loop = true
      a.dir = a.t <= 0 ? 1 : -1
      a.playing = true
    }
    setPlaying(true)
    applyFilter()
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: accent,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: gradient(accent) }}>
        <Label title="场景 A" subtitle="液态形变 · 起点" />
      </div>
      <div
        ref={bRef}
        style={{
          position: 'absolute',
          inset: 0,
          background: gradient(bColor),
          opacity: 0,
          filter: `url(#${filterId})`,
        }}
      >
        <Label title="场景 B" subtitle="液态形变 · 终点" />
      </div>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <filter
            id={filterId}
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={baseFreq}
              numOctaves={3}
              seed={7}
              result="noise"
            />
            <feDisplacementMap
              ref={dispRef}
              in="SourceGraphic"
              in2="noise"
              scale={0}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur ref={blurRef} in="displaced" stdDeviation={0} />
          </filter>
        </defs>
      </svg>
      {!preview && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: 20,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={play}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              border: `1px solid ${accent}`,
              background: 'rgba(0,0,0,0.35)',
              color: '#fff',
              borderRadius: 999,
              padding: '10px 26px',
              fontSize: 14,
              letterSpacing: 2,
              backdropFilter: 'blur(6px)',
            }}
          >
            {playing ? (dir === 'loop' ? '停止' : '转场中…') : '播放转场'}
          </button>
        </div>
      )}
    </div>
  )
}

export const Preview: ExperimentModule['Preview'] = (props) => <Stage {...props} preview />
export const Renderer: ExperimentModule['Renderer'] = (props) => <Stage {...props} preview={false} />

const module: ExperimentModule = { Preview, Renderer }
export default module
export { definition }
