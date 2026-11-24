import { useEffect, useState } from 'react'
import type { ComponentType, CSSProperties } from 'react'
import type { ExperimentComponentProps } from '@/experiments/shared/types'
import { definition } from './meta'

const HEX_CHARS = '0123456789ABCDEF'
const STATUS = ['SYNC', 'LINK', 'ACTIVE', 'STANDBY', 'PING', 'LOCK', 'SCAN', 'OK', 'TX', 'RX']

function randomHex(len: number): string {
  let out = ''
  for (let i = 0; i < len; i++) out += HEX_CHARS[Math.floor(Math.random() * 16)]
  return out
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const num = parseInt(full, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface DataLine {
  label: string
  value: string
}

function buildLines(): DataLine[] {
  const status = STATUS[Math.floor(Math.random() * STATUS.length)]
  return [
    { label: 'SYS.CORE', value: `0x${randomHex(8)}` },
    { label: 'NODE.LINK', value: status },
    { label: 'FREQ', value: `${(Math.random() * 8 + 1).toFixed(2)} GHz` },
    { label: 'TEMP', value: `${(Math.random() * 40 + 20).toFixed(1)}°C` },
    { label: 'SIGNAL', value: `${Math.floor(Math.random() * 100)}%` },
  ]
}

interface GlitchState {
  on: boolean
  x: number
  clipTop: number
  clipBottom: number
  hue: number
}

const KEYFRAMES = `
@keyframes holoScan {
  0% { top: -8%; opacity: 0; }
  12% { opacity: 1; }
  88% { opacity: 1; }
  100% { top: 108%; opacity: 0; }
}
@keyframes holoFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-7px); }
}
@keyframes holoBeam {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.42; }
}
@keyframes holoPulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
`

function Stage(props: ExperimentComponentProps & { preview?: boolean }) {
  const { config, preview = false } = props

  const color = String(config.hologramColor ?? '#38e1ff')
  const glow = Number(config.glowIntensity)
  const glitchIntensity = Number(config.glitchIntensity)
  const opacity = Number(config.opacity)
  const scanSpeed = Math.max(0.2, Number(config.scanSpeed))
  const showScanline = config.showScanline !== false

  const [lines, setLines] = useState<DataLine[]>(() => buildLines())
  const [glitch, setGlitch] = useState<GlitchState>({
    on: false,
    x: 0,
    clipTop: 0,
    clipBottom: 0,
    hue: 0,
  })

  // Animated "data" readout — random hex / status text.
  useEffect(() => {
    const interval = window.setInterval(() => setLines(buildLines()), preview ? 600 : 150)
    return () => window.clearInterval(interval)
  }, [preview])

  // Glitch scheduling — intensity scales frequency + magnitude of the jitter.
  useEffect(() => {
    if (preview || glitchIntensity <= 0.01) return
    let timeout = 0
    let cancel = false
    const schedule = () => {
      const delay = (Math.random() * 900 + 160) * (1.7 - glitchIntensity)
      timeout = window.setTimeout(() => {
        if (cancel) return
        const burst = 70 + Math.random() * 160
        setGlitch({
          on: true,
          x: (Math.random() * 2 - 1) * 16 * glitchIntensity,
          clipTop: Math.random() * 40 * glitchIntensity,
          clipBottom: Math.random() * 40 * glitchIntensity,
          hue: (Math.random() * 2 - 1) * 180 * glitchIntensity,
        })
        window.setTimeout(() => {
          if (!cancel) setGlitch((s) => ({ ...s, on: false }))
        }, burst)
        schedule()
      }, delay)
    }
    schedule()
    return () => {
      cancel = true
      window.clearTimeout(timeout)
    }
  }, [preview, glitchIntensity])

  const panelStyle: CSSProperties = {
    position: 'relative',
    width: 'min(82%, 440px)',
    aspectRatio: '1.55',
    background: `linear-gradient(155deg, ${hexToRgba(color, 0.16 * opacity)}, ${hexToRgba(color, 0.04 * opacity)})`,
    border: `1px solid ${hexToRgba(color, 0.55 * opacity)}`,
    borderRadius: 16,
    boxShadow: [
      `0 0 ${(6 + glow * 36).toFixed(1)}px ${hexToRgba(color, 0.16 + glow * 0.5)}`,
      `inset 0 0 ${(12 + glow * 26).toFixed(1)}px ${hexToRgba(color, 0.08 + glow * 0.28)}`,
    ].join(', '),
    backdropFilter: preview ? undefined : 'blur(6px)',
    filter: glitch.on ? `hue-rotate(${glitch.hue}deg)` : undefined,
    clipPath: glitch.on ? `inset(${glitch.clipTop}% 0 ${glitch.clipBottom}% 0)` : undefined,
    transform: glitch.on ? `translateX(${glitch.x}px)` : undefined,
    transition: preview ? undefined : 'filter 60ms linear',
    color: color,
    fontFamily:
      "'SFMono-Regular', 'Cascadia Mono', 'Consolas', 'Menlo', monospace",
  }

  const contentStyle: CSSProperties = {
    position: 'relative',
    height: '100%',
    boxSizing: 'border-box',
    padding: '7% 8%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderRadius: 16,
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: preview ? 11 : 15,
    letterSpacing: '0.14em',
    fontWeight: 700,
    textShadow: `0 0 ${(6 + glow * 12).toFixed(1)}px ${hexToRgba(color, 0.9)}`,
  }

  const dotStyle: CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: color,
    boxShadow: `0 0 ${(8 + glow * 12).toFixed(1)}px ${color}`,
    animation: 'holoPulse 1.6s ease-in-out infinite',
  }

  const rowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: preview ? 9 : 12,
    letterSpacing: '0.06em',
    opacity: 0.85,
  }

  const scanlineStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: preview ? 2 : 3,
    background: `linear-gradient(180deg, transparent, ${hexToRgba(color, 0.9)}, transparent)`,
    boxShadow: `0 0 ${(10 + glow * 18).toFixed(1)}px ${color}`,
    animation: `holoScan ${(4 / scanSpeed).toFixed(2)}s linear infinite`,
    pointerEvents: 'none',
  }

  const beamStyle: CSSProperties = {
    width: 'min(52%, 280px)',
    height: 'min(26vh, 150px)',
    marginTop: -2,
    clipPath: 'polygon(38% 0, 62% 0, 100% 100%, 0 100%)',
    background: `linear-gradient(180deg, ${hexToRgba(color, 0.34 * opacity)}, ${hexToRgba(color, 0)})`,
    animation: 'holoBeam 2.4s ease-in-out infinite',
    filter: preview ? undefined : 'blur(1px)',
  }

  const visibleLines = preview ? lines.slice(0, 3) : lines

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(120% 120% at 50% 20%, ${hexToRgba(color, 0.08)}, #05060f 60%)`,
      }}
    >
      <style>{KEYFRAMES}</style>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          animation: preview ? undefined : 'holoFloat 6s ease-in-out infinite',
        }}
      >
        <div style={panelStyle}>
          {showScanline && <div style={scanlineStyle} />}
          <div style={contentStyle}>
            <div style={headerStyle}>
              <span style={dotStyle} />
              <span>HOLOGRAM // 01</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {visibleLines.map((l) => (
                <div key={l.label} style={rowStyle}>
                  <span style={{ opacity: 0.6 }}>{l.label}</span>
                  <span style={{ textShadow: `0 0 8px ${hexToRgba(color, 0.7)}` }}>{l.value}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: preview ? 8 : 10, opacity: 0.5, letterSpacing: '0.2em' }}>
              ▲ PROJECTION ACTIVE
            </div>
          </div>
        </div>
      </div>
      <div style={beamStyle} />
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
