import { useRef } from 'react'
import type { UIEvent } from 'react'
import type { ExperimentModule, ExperimentComponentProps } from '@/experiments/shared/types'
import { useAnimationFrame } from '@/experiments/shared/useAnimationFrame'
import { useElementSize } from '@/experiments/shared/useElementSize'
import { definition } from './meta'

const PANELS = [
  { no: '01', title: '起点', text: '一切从一个念头开始。' },
  { no: '02', title: '探索', text: '在未知里留下坐标。' },
  { no: '03', title: '转折', text: '一个选择，改变了航向。' },
  { no: '04', title: '高潮', text: '把所有力量汇聚成光。' },
  { no: '05', title: '领悟', text: '终于看清了来时的路。' },
  { no: '06', title: '终章', text: '落幕，亦是新的篇章。' },
]

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

function panelBg(accent: string, i: number): string {
  const h = (hueOf(accent) + i * 42) % 360
  return `linear-gradient(135deg, hsl(${h}, 72%, 48%), hsl(${(h + 72) % 360}, 80%, 18%))`
}

function Stage({ config, preview }: ExperimentComponentProps & { preview?: boolean }) {
  const { ref, size } = useElementSize<HTMLDivElement>()
  const progress = useRef(0)
  const target = useRef(0)
  const rowRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs = useRef<(HTMLDivElement | null)[]>([])

  const count = Math.min(6, Math.max(3, Math.round(Number(config.sectionCount) || 4)))
  const accent = config.accentColor ?? '#38e1ff'
  const vw = size.width || 800
  const vh = size.height || 480
  const panels = PANELS.slice(0, count)

  useAnimationFrame((dt, elapsed) => {
    if (preview) {
      const period = 9
      const t = (elapsed % period) / period
      target.current = t < 0.5 ? t * 2 : 2 - t * 2
    }
    const k = 1 - Math.exp(-dt / Math.max(0.05, Number(config.transitionDuration)))
    progress.current += (target.current - progress.current) * k
    const p = Math.min(1, Math.max(0, progress.current))
    const sp = Number(config.scrollSpeed)
    const x = -Math.min(1, p * sp) * (count - 1) * vw
    if (rowRef.current) rowRef.current.style.transform = `translate3d(${x}px, 0, 0)`
    if (barRef.current) barRef.current.style.width = `${p * 100}%`
    const active = Math.round(p * (count - 1))
    panelRefs.current.forEach((el, i) => {
      if (!el) return
      el.style.borderColor = i === active ? accent : 'rgba(255,255,255,0.1)'
      el.style.boxShadow = i === active ? `0 0 42px ${accent}55` : 'none'
    })
    dotRefs.current.forEach((el, i) => {
      if (!el) return
      const on = i === active
      el.style.width = on ? '22px' : '8px'
      el.style.background = on ? accent : 'rgba(255,255,255,0.25)'
    })
  })

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    if (max > 0) target.current = Math.min(1, Math.max(0, el.scrollTop / max))
  }

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: '#05060d',
      }}
    >
      <div style={{ height: count * vh, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: vh, width: '100%', overflow: 'hidden' }}>
          <div
            ref={rowRef}
            style={{ display: 'flex', width: count * vw, height: '100%', willChange: 'transform' }}
          >
            {panels.map((panel, i) => (
              <div
                key={panel.no}
                ref={(el) => {
                  panelRefs.current[i] = el
                }}
                style={{
                  width: vw,
                  height: '100%',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: panelBg(accent, i),
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: `${40 * Number(config.contentSpacing)}px ${36 * Number(config.contentSpacing)}px`,
                }}
              >
                <div style={{ fontSize: 120, fontWeight: 800, lineHeight: 1, opacity: 0.25 }}>{panel.no}</div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      letterSpacing: 4,
                      opacity: 0.75,
                      textTransform: 'uppercase',
                      marginBottom: 10,
                    }}
                  >
                    Chapter {panel.no}
                  </div>
                  <h2 style={{ margin: 0, fontSize: 44, fontWeight: 800, letterSpacing: 3 }}>{panel.title}</h2>
                  <p style={{ margin: '16px 0 0', fontSize: 15, opacity: 0.8, maxWidth: 420 }}>{panel.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, pointerEvents: 'none' }}>
            {!!config.showProgress && (
              <div
                style={{
                  height: 3,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.12)',
                  overflow: 'hidden',
                  marginBottom: 14,
                }}
              >
                <div
                  ref={barRef}
                  style={{
                    height: '100%',
                    width: 0,
                    background: accent,
                    boxShadow: `0 0 10px ${accent}`,
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
              {panels.map((panel, i) => (
                <div
                  key={panel.no}
                  ref={(el) => {
                    dotRefs.current[i] = el
                  }}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 5,
                    background: 'rgba(255,255,255,0.25)',
                    transition: 'width 0.3s, background 0.3s',
                  }}
                />
              ))}
            </div>
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
