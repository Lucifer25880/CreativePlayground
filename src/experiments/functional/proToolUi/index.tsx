import { useEffect, useMemo, useState } from 'react'
import type { ExperimentModule, ExperimentComponentProps } from '@/experiments/shared/types'
import { definition } from './meta'

interface ShapeObj {
  id: string
  type: 'rect' | 'circle'
  x: number
  y: number
  w: number
  h: number
  color: string
  name: string
}

let uid = 0
const nextId = () => `obj-${++uid}-${Math.random().toString(36).slice(2, 7)}`

const POSITIONS = [
  { x: 60, y: 60 },
  { x: 260, y: 90 },
  { x: 130, y: 260 },
  { x: 320, y: 300 },
  { x: 70, y: 400 },
  { x: 400, y: 130 },
  { x: 340, y: 460 },
  { x: 190, y: 180 },
]

const PALETTE = ['#7c6cff', '#38e1ff', '#ffb454', '#ff6b9d', '#6bff9d', '#ffd23f', '#b46bff', '#ff9d6b']

function makeObject(i: number, accent: string): ShapeObj {
  const p = POSITIONS[i % POSITIONS.length]
  const circle = i % 2 === 1
  const size = circle ? 84 : 110
  return {
    id: nextId(),
    type: circle ? 'circle' : 'rect',
    x: p.x,
    y: p.y,
    w: size,
    h: circle ? size : 80,
    color: i === 0 ? accent : PALETTE[i % PALETTE.length],
    name: `对象 ${i + 1}`,
  }
}

function seedObjects(count: number, accent: string): ShapeObj[] {
  return Array.from({ length: count }, (_, i) => makeObject(i, accent))
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

interface Theme {
  bg: string
  panel: string
  border: string
  text: string
  sub: string
  canvasBg: string
  track: string
  trackAlt: string
}

const themes: Record<string, Theme> = {
  dark: {
    bg: '#0d0d17',
    panel: '#151524',
    border: '#262637',
    text: '#e8e8f0',
    sub: '#8a8aa5',
    canvasBg: '#0a0a12',
    track: '#1b1b2c',
    trackAlt: '#131322',
  },
  light: {
    bg: '#eef0f6',
    panel: '#ffffff',
    border: '#d8dae6',
    text: '#1a1a28',
    sub: '#6a6a80',
    canvasBg: '#f7f8fc',
    track: '#e9ebf2',
    trackAlt: '#e2e4ec',
  },
}

function ProToolUi({ config, preview }: ExperimentComponentProps) {
  const accent = config.accentColor ?? '#7c6cff'
  const themeKey = config.theme ?? 'dark'
  const t = themes[themeKey] || themes.dark
  const panelLayout = config.panelLayout ?? 'both'
  const timelineZoom = clamp(Number(config.timelineZoom) || 1, 0.5, 2)
  const showGuides = !!config.showGuides
  const snapEnabled = !!config.snapEnabled

  const [objects, setObjects] = useState<ShapeObj[]>(() => seedObjects(4, accent))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [playhead, setPlayhead] = useState(2.5)

  // sync object count with config.objectCount
  useEffect(() => {
    const target = Math.max(2, Math.min(8, Math.round(Number(config.objectCount) || 4)))
    setObjects((prev) => {
      if (prev.length === target) return prev
      if (prev.length < target) {
        const extra = Array.from({ length: target - prev.length }, (_, i) =>
          makeObject(prev.length + i, accent),
        )
        return [...prev, ...extra]
      }
      const next = prev.slice(0, target)
      setSelectedId((s) => (next.some((o) => o.id === s) ? s : null))
      return next
    })
  }, [config.objectCount, accent])

  const selected = useMemo(() => objects.find((o) => o.id === selectedId) ?? null, [objects, selectedId])

  const addObject = (type: 'rect' | 'circle') => {
    const i = objects.length
    const p = POSITIONS[i % POSITIONS.length]
    const obj: ShapeObj = {
      id: nextId(),
      type,
      x: p.x + 20,
      y: p.y + 20,
      w: type === 'circle' ? 84 : 110,
      h: type === 'circle' ? 84 : 80,
      color: i === 0 ? accent : PALETTE[i % PALETTE.length],
      name: `对象 ${i + 1}`,
    }
    setObjects((prev) => [...prev, obj])
    setSelectedId(obj.id)
  }

  const deleteSelected = () => {
    if (!selectedId) return
    setObjects((prev) => prev.filter((o) => o.id !== selectedId))
    setSelectedId(null)
  }

  // ---- drag move ----
  const startMove = (e: React.PointerEvent, id: string) => {
    e.stopPropagation()
    if (e.button !== 0) return
    setSelectedId(id)
    const obj = objects.find((o) => o.id === id)
    if (!obj) return
    const sx = e.clientX
    const sy = e.clientY
    const ox = obj.x
    const oy = obj.y
    const snap = snapEnabled
    const move = (ev: PointerEvent) => {
      let nx = ox + ev.clientX - sx
      let ny = oy + ev.clientY - sy
      if (snap) {
        nx = Math.round(nx / 40) * 40
        ny = Math.round(ny / 40) * 40
      }
      setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, x: nx, y: ny } : o)))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // ---- resize ----
  const startResize = (e: React.PointerEvent, id: string) => {
    e.stopPropagation()
    if (e.button !== 0) return
    const obj = objects.find((o) => o.id === id)
    if (!obj) return
    const sx = e.clientX
    const sy = e.clientY
    const ow = obj.w
    const oh = obj.h
    const move = (ev: PointerEvent) => {
      let nw = Math.max(24, ow + ev.clientX - sx)
      let nh = Math.max(24, oh + ev.clientY - sy)
      nw = Math.round(nw / 4) * 4
      nh = Math.round(nh / 4) * 4
      setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, w: nw, h: nh } : o)))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // ---- playhead scrub ----
  const pxPerSec = 40
  const duration = 10
  const contentWidth = duration * pxPerSec * timelineZoom
  const startScrub = (e: React.PointerEvent) => {
    e.stopPropagation()
    if (e.button !== 0) return
    const sx = e.clientX
    const st = playhead
    const z = timelineZoom
    const move = (ev: PointerEvent) => {
      const dt = (ev.clientX - sx) / (pxPerSec * z)
      setPlayhead(clamp(st + dt, 0, duration))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const updateSelected = (patch: Partial<ShapeObj>) => {
    if (!selectedId) return
    setObjects((prev) => prev.map((o) => (o.id === selectedId ? { ...o, ...patch } : o)))
  }

  const showLeft = panelLayout === 'left' || panelLayout === 'both'
  const showRight = panelLayout === 'right' || panelLayout === 'both'

  const numberInput = (label: string, value: number, onChange: (n: number) => void) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: t.sub }}>
      {label}
      <input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        style={{
          background: t.canvasBg,
          border: `1px solid ${t.border}`,
          borderRadius: 6,
          color: t.text,
          padding: '4px 8px',
          fontSize: 12,
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </label>
  )

  const propertiesBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>属性</div>
      {selected ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {numberInput('X', selected.x, (n) => updateSelected({ x: n }))}
            {numberInput('Y', selected.y, (n) => updateSelected({ y: n }))}
            {numberInput('宽', selected.w, (n) => updateSelected({ w: n }))}
            {numberInput('高', selected.h, (n) => updateSelected({ h: n }))}
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: t.sub }}>
            名称
            <input
              value={selected.name}
              onChange={(e) => updateSelected({ name: e.target.value })}
              style={{
                background: t.canvasBg,
                border: `1px solid ${t.border}`,
                borderRadius: 6,
                color: t.text,
                padding: '4px 8px',
                fontSize: 12,
              }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: t.sub }}>
            颜色
            <input
              type="color"
              value={selected.color}
              onChange={(e) => updateSelected({ color: e.target.value })}
              style={{ width: '100%', height: 28, padding: 0, border: 'none', background: 'transparent' }}
            />
          </label>
        </>
      ) : (
        <div style={{ fontSize: 12, color: t.sub }}>未选中对象</div>
      )}
    </div>
  )

  const layersBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>图层</div>
      {[...objects].reverse().map((o) => (
        <div
          key={o.id}
          onClick={() => setSelectedId(o.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px',
            borderRadius: 6,
            cursor: 'pointer',
            background: selectedId === o.id ? `${accent}22` : 'transparent',
            border: `1px solid ${selectedId === o.id ? accent : 'transparent'}`,
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: o.type === 'circle' ? '50%' : 2, background: o.color }} />
          <span style={{ fontSize: 12, color: t.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {o.name}
          </span>
          <span style={{ fontSize: 10, color: t.sub }}>{o.type === 'circle' ? '圆' : '方'}</span>
        </div>
      ))}
    </div>
  )

  // guides
  const guideStyle: React.CSSProperties = {
    position: 'absolute',
    background: 'transparent',
    borderLeft: `1px dashed ${accent}55`,
    pointerEvents: 'none',
  }

  if (preview) {
    // static layout preview
    return (
      <div style={{ position: 'absolute', inset: 0, background: t.bg, display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: 130, background: t.panel, borderRight: `1px solid ${t.border}`, padding: 10 }}>
          <div style={{ width: '100%', height: 10, background: accent, borderRadius: 3, marginBottom: 10 }} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 22, borderRadius: 5, background: t.track, marginBottom: 6 }} />
          ))}
        </div>
        <div style={{ flex: 1, background: t.canvasBg, position: 'relative', margin: 8, borderRadius: 8, border: `1px solid ${t.border}` }}>
          <div style={{ position: 'absolute', left: 30, top: 24, width: 70, height: 50, background: accent, borderRadius: 4 }} />
          <div style={{ position: 'absolute', left: 160, top: 90, width: 50, height: 50, background: '#38e1ff', borderRadius: '50%' }} />
        </div>
        <div style={{ width: 130, background: t.panel, borderLeft: `1px solid ${t.border}`, padding: 10 }}>
          <div style={{ width: '100%', height: 10, background: '#38e1ff', borderRadius: 3, marginBottom: 10 }} />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 18, borderRadius: 4, background: t.track, marginBottom: 6 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: t.bg,
        color: t.text,
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        userSelect: 'none',
      }}
    >
      {/* top toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          background: t.panel,
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, marginRight: 6, color: accent }}>ProTool</span>
        <button title="选择" onClick={() => setSelectedId(null)} style={iconBtn(t, accent)}>⌖</button>
        <button title="添加矩形" onClick={() => addObject('rect')} style={iconBtn(t, accent)}>▭</button>
        <button title="添加圆形" onClick={() => addObject('circle')} style={iconBtn(t, accent)}>◯</button>
        <button title="删除选中" onClick={deleteSelected} disabled={!selectedId} style={iconBtn(t, accent, !selectedId)}>🗑</button>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: t.sub }}>
          吸附 {snapEnabled ? '40px' : '关'} · {objects.length} 个对象
        </span>
      </div>

      {/* body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {showLeft && (
          <div
            style={{
              width: 190,
              background: t.panel,
              borderRight: `1px solid ${t.border}`,
              padding: 12,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {propertiesBlock}
            {panelLayout === 'left' && layersBlock}
          </div>
        )}

        {/* central canvas */}
        <div
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null)
          }}
          style={{ flex: 1, position: 'relative', overflow: 'hidden', background: t.canvasBg }}
        >
          {showGuides && (
            <>
              <div style={{ ...guideStyle, left: '33%', top: 0, bottom: 0 }} />
              <div style={{ ...guideStyle, left: '66%', top: 0, bottom: 0 }} />
              <div style={{ ...guideStyle, left: 0, right: 0, top: '50%', borderLeft: 'none', borderTop: `1px dashed ${accent}55` }} />
            </>
          )}
          {objects.map((o) => (
            <div
              key={o.id}
              onPointerDown={(e) => startMove(e, o.id)}
              style={{
                position: 'absolute',
                left: o.x,
                top: o.y,
                width: o.w,
                height: o.h,
                background: o.color,
                borderRadius: o.type === 'circle' ? '50%' : 4,
                cursor: 'move',
                boxShadow: selectedId === o.id ? `0 0 0 2px ${accent}` : '0 4px 12px rgba(0,0,0,0.25)',
                touchAction: 'none',
              }}
            >
              {selectedId === o.id && (
                <div
                  onPointerDown={(e) => startResize(e, o.id)}
                  style={{
                    position: 'absolute',
                    right: -6,
                    bottom: -6,
                    width: 12,
                    height: 12,
                    background: '#fff',
                    border: `2px solid ${accent}`,
                    borderRadius: 3,
                    cursor: 'nwse-resize',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {showRight && (
          <div
            style={{
              width: 190,
              background: t.panel,
              borderLeft: `1px solid ${t.border}`,
              padding: 12,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {panelLayout === 'right' ? propertiesBlock : null}
            {layersBlock}
          </div>
        )}
      </div>

      {/* timeline */}
      <div style={{ background: t.panel, borderTop: `1px solid ${t.border}`, padding: '8px 12px', position: 'relative' }}>
        <div style={{ fontSize: 10, color: t.sub, marginBottom: 4 }}>时间轴 · {playhead.toFixed(1)}s</div>
        <div style={{ position: 'relative', overflowX: 'auto', overflowY: 'hidden', background: t.trackAlt, borderRadius: 6, height: 84 }}>
          <div style={{ position: 'relative', width: contentWidth, height: 84 }}>
            {/* ruler */}
            {Array.from({ length: duration + 1 }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: i * pxPerSec * timelineZoom,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: t.border,
                }}
              >
                <span style={{ position: 'absolute', top: 2, left: 3, fontSize: 9, color: t.sub }}>{i}s</span>
              </div>
            ))}
            {/* tracks */}
            {objects.map((o, i) => {
              const trackH = 18
              const y = 22 + i * trackH
              const clipW = duration * pxPerSec * timelineZoom * 0.6
              const clipX = (i % 3) * 30
              return (
                <div key={o.id} style={{ position: 'absolute', left: 0, top: y, width: contentWidth, height: trackH }}>
                  <div
                    onClick={() => setSelectedId(o.id)}
                    style={{
                      position: 'absolute',
                      left: clipX,
                      width: clipW,
                      height: trackH - 4,
                      background: o.color,
                      borderRadius: 3,
                      opacity: 0.85,
                      fontSize: 10,
                      lineHeight: `${trackH - 4}px`,
                      paddingLeft: 6,
                      color: '#111',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                  >
                    {o.name}
                  </div>
                </div>
              )
            })}
            {/* playhead */}
            <div
              style={{
                position: 'absolute',
                left: playhead * pxPerSec * timelineZoom,
                top: 0,
                bottom: 0,
                width: 1,
                background: accent,
              }}
            >
              <div
                onPointerDown={startScrub}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: -6,
                  width: 13,
                  height: 14,
                  background: accent,
                  borderRadius: 3,
                  cursor: 'ew-resize',
                  clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function iconBtn(t: Theme, accent: string, disabled = false): React.CSSProperties {
  return {
    width: 30,
    height: 30,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    border: `1px solid ${t.border}`,
    background: disabled ? t.track : `${accent}1f`,
    color: disabled ? t.sub : t.text,
    fontSize: 14,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

export const Preview: ExperimentModule['Preview'] = (props) => <ProToolUi {...props} preview />
export const Renderer: ExperimentModule['Renderer'] = (props) => <ProToolUi {...props} />

const module: ExperimentModule = { Preview, Renderer }
export default module
export { definition }
