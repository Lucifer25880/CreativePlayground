import { useCallback, useEffect, useRef, useState } from 'react'
import type { ExperimentModule, ExperimentComponentProps } from '@/experiments/shared/types'
import { definition } from './meta'

const NODE_W = 180
const NODE_H = 60

interface NodeData {
  id: string
  x: number
  y: number
  title: string
  color: string
}

interface EdgeData {
  id: string
  from: string
  to: string
}

let uid = 0
const nextId = (p: string) => `${p}-${++uid}-${Math.random().toString(36).slice(2, 7)}`

function hexToRgba(hex: string, alpha: number): string {
  const h = (hex || '#7c6cff').replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16) || 0
  const g = parseInt(full.slice(2, 4), 16) || 0
  const b = parseInt(full.slice(4, 6), 16) || 0
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function edgePath(style: string, x1: number, y1: number, x2: number, y2: number): string {
  if (style === 'straight') return `M ${x1} ${y1} L ${x2} ${y2}`
  const mid = (x1 + x2) / 2
  if (style === 'step') return `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`
  const c = Math.max(30, Math.abs(x2 - x1) / 2)
  return `M ${x1} ${y1} C ${x1 + c} ${y1}, ${x2 - c} ${y2}, ${x2} ${y2}`
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function seedNodes(): NodeData[] {
  return [
    { id: 'n1', x: -180, y: -90, title: '输入', color: '#7c6cff' },
    { id: 'n2', x: 130, y: -90, title: '处理', color: '#38e1ff' },
    { id: 'n3', x: 130, y: 110, title: '输出', color: '#ffb454' },
  ]
}

function seedEdges(): EdgeData[] {
  return [
    { id: 'e1', from: 'n1', to: 'n2' },
    { id: 'e2', from: 'n2', to: 'n3' },
  ]
}

/* ----------------------------- Static preview ----------------------------- */

function StaticGraph({ config }: { config: Record<string, any> }) {
  const accent = config.accentColor ?? '#7c6cff'
  const style = config.connectionStyle ?? 'bezier'
  const pts = [
    { id: 'a', x: 40, y: 40, t: 'A', c: accent },
    { id: 'b', x: 210, y: 40, t: 'B', c: '#38e1ff' },
    { id: 'c', x: 210, y: 130, t: 'C', c: '#ffb454' },
  ]
  const d1 = edgePath(style, 40 + 60, 40, 210 - 60, 40)
  const d2 = edgePath(style, 210 + 60, 40, 210 - 60, 130)
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0c0c16' }}>
      <svg width="100%" height="100%" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet">
        <path d={d1} fill="none" stroke={accent} strokeWidth={2} />
        <path d={d2} fill="none" stroke={accent} strokeWidth={2} opacity={0.6} />
        {pts.map((p) => (
          <g key={p.id}>
            <rect
              x={p.x - 60}
              y={p.y - 22}
              width={120}
              height={44}
              rx={8}
              fill="#161624"
              stroke={p.c}
              strokeWidth={2}
            />
            <circle cx={p.x - 60} cy={p.y} r={4} fill={p.c} />
            <circle cx={p.x + 60} cy={p.y} r={4} fill={p.c} />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fill="#e8e8f0" fontSize={12}>
              {p.t}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/* ------------------------------- Main editor ------------------------------ */

function NodeEditor({ config, preview }: ExperimentComponentProps) {
  const [nodes, setNodes] = useState<NodeData[]>(seedNodes)
  const [edges, setEdges] = useState<EdgeData[]>(seedEdges)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pan, setPan] = useState({ x: 140, y: 120 })
  const [innerZoom, setInnerZoom] = useState(1)
  const [connecting, setConnecting] = useState<{ from: string } | null>(null)
  const [tempPoint, setTempPoint] = useState<{ x: number; y: number } | null>(null)

  const viewportRef = useRef<HTMLDivElement>(null)
  const panRef = useRef(pan)
  const zoomRef = useRef(1)
  const connectingRef = useRef<{ from: string } | null>(null)

  const accent = config.accentColor ?? '#7c6cff'
  const gridSize = Number(config.gridSize) || 24
  const nodeSpacing = Number(config.nodeSpacing) || 120
  const connStyle = config.connectionStyle ?? 'bezier'
  const snapToGrid = !!config.snapToGrid
  const autoLayout = !!config.autoLayout
  const effZoom = clamp((Number(config.zoom) || 1) * innerZoom, 0.1, 8)

  useEffect(() => {
    panRef.current = pan
  }, [pan])
  useEffect(() => {
    zoomRef.current = effZoom
  }, [effZoom])
  useEffect(() => {
    connectingRef.current = connecting
  }, [connecting])

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id))
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id))
    setSelectedId((s) => (s === id ? null : s))
  }, [])

  // Delete key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const t = e.target as HTMLElement | null
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
        deleteNode(selectedId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, deleteNode])

  // Auto layout
  useEffect(() => {
    if (!autoLayout) return
    setNodes((prev) =>
      prev.map((nd, i) => ({
        ...nd,
        x: 0,
        y: (i - (prev.length - 1) / 2) * nodeSpacing,
      })),
    )
  }, [autoLayout, nodeSpacing, nodes.length])

  const addNodeAt = useCallback(
    (x: number, y: number) => {
      const id = nextId('node')
      setNodes((prev) => [
        ...prev,
        { id, x, y, title: `节点 ${prev.length + 1}`, color: accent },
      ])
      setSelectedId(id)
    },
    [accent],
  )

  const addNode = useCallback(() => {
    const n = nodes.length
    addNodeAt((n % 3) * 60 - 40, Math.floor(n / 3) * 150 - 60)
  }, [nodes.length, addNodeAt])

  // Wheel zoom (non-passive so preventDefault works)
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setInnerZoom((z) => clamp(z * (e.deltaY < 0 ? 1.1 : 0.9), 0.4, 4))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const screenToWorld = (clientX: number, clientY: number) => {
    const el = viewportRef.current
    if (!el) return { x: 0, y: 0 }
    const r = el.getBoundingClientRect()
    const z = zoomRef.current
    return {
      x: (clientX - r.left - panRef.current.x) / z,
      y: (clientY - r.top - panRef.current.y) / z,
    }
  }

  const onDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('[data-node]')) return
    const p = screenToWorld(e.clientX, e.clientY)
    addNodeAt(p.x, p.y)
  }

  const startPan = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const sx = e.clientX
    const sy = e.clientY
    const ox = panRef.current.x
    const oy = panRef.current.y
    const move = (ev: PointerEvent) => setPan({ x: ox + ev.clientX - sx, y: oy + ev.clientY - sy })
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const startNodeDrag = (e: React.PointerEvent, id: string) => {
    e.stopPropagation()
    if (e.button !== 0) return
    setSelectedId(id)
    const target = nodes.find((n) => n.id === id)
    if (!target) return
    const sx = e.clientX
    const sy = e.clientY
    const ox = target.x
    const oy = target.y
    const z = zoomRef.current
    const snap = snapToGrid
    const g = gridSize
    const move = (ev: PointerEvent) => {
      let nx = ox + (ev.clientX - sx) / z
      let ny = oy + (ev.clientY - sy) / z
      if (snap) {
        nx = Math.round(nx / g) * g
        ny = Math.round(ny / g) * g
      }
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x: nx, y: ny } : n)))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const startConnect = (e: React.PointerEvent, id: string) => {
    e.stopPropagation()
    if (e.button !== 0) return
    setConnecting({ from: id })
    connectingRef.current = { from: id }
    const move = (ev: PointerEvent) => setTempPoint(screenToWorld(ev.clientX, ev.clientY))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setConnecting(null)
      connectingRef.current = null
      setTempPoint(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const finishConnect = (e: React.PointerEvent, targetId: string) => {
    e.stopPropagation()
    const from = connectingRef.current
    if (from && from.from !== targetId) {
      setEdges((prev) =>
        prev.some((ed) => ed.from === from.from && ed.to === targetId)
          ? prev
          : [...prev, { id: nextId('edge'), from: from.from, to: targetId }],
      )
    }
    setConnecting(null)
    connectingRef.current = null
    setTempPoint(null)
  }

  const selected = nodes.find((n) => n.id === selectedId)

  // Grid background (moves with pan / scales with zoom)
  const gs = gridSize * effZoom
  const gridStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(to right, ${hexToRgba(accent, 0.14)} 1px, transparent 1px), linear-gradient(to bottom, ${hexToRgba(accent, 0.14)} 1px, transparent 1px)`,
    backgroundSize: `${gs}px ${gs}px`,
    backgroundPosition: `${pan.x}px ${pan.y}px`,
  }

  const tempPath =
    connecting && tempPoint
      ? edgePath(
          connStyle,
          (nodes.find((n) => n.id === connecting.from)?.x ?? 0) + NODE_W / 2,
          nodes.find((n) => n.id === connecting.from)?.y ?? 0,
          tempPoint.x,
          tempPoint.y,
        )
      : null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#0c0c16',
        color: '#e8e8f0',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        userSelect: 'none',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderBottom: `1px solid ${hexToRgba(accent, 0.25)}`,
          background: '#12121f',
        }}
      >
        <button onClick={addNode} style={btnStyle(accent)}>
          + 添加节点
        </button>
        <button
          onClick={() => selectedId && deleteNode(selectedId)}
          disabled={!selectedId}
          style={btnStyle(accent, !selectedId)}
        >
          删除
        </button>
        <span style={{ fontSize: 12, color: '#9a9ab0', marginLeft: 8 }}>
          双击画布新建 · 拖拽端口连线
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setInnerZoom((z) => clamp(z * 1.25, 0.4, 4))} style={btnStyle(accent)}>
            +
          </button>
          <span style={{ fontSize: 12, minWidth: 44, textAlign: 'center' }}>
            {Math.round(effZoom * 100)}%
          </span>
          <button onClick={() => setInnerZoom((z) => clamp(z / 1.25, 0.4, 4))} style={btnStyle(accent)}>
            −
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        onDoubleClick={onDoubleClick}
        onPointerDown={startPan}
        style={{ position: 'relative', flex: 1, overflow: 'hidden', cursor: 'grab', touchAction: 'none' }}
      >
        {/* infinite grid */}
        <div style={{ position: 'absolute', inset: 0, ...gridStyle }} />

        {/* world (pan + zoom) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${effZoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* connections */}
          <svg
            style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible' }}
          >
            {edges.map((ed) => {
              const from = nodes.find((n) => n.id === ed.from)
              const to = nodes.find((n) => n.id === ed.to)
              if (!from || !to) return null
              const d = edgePath(
                connStyle,
                from.x + NODE_W / 2,
                from.y,
                to.x - NODE_W / 2,
                to.y,
              )
              return (
                <path
                  key={ed.id}
                  d={d}
                  fill="none"
                  stroke={accent}
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              )
            })}
            {tempPath && (
              <path d={tempPath} fill="none" stroke={accent} strokeWidth={2} strokeDasharray="6 4" opacity={0.9} />
            )}
          </svg>

          {/* nodes */}
          {nodes.map((n) => (
            <div
              key={n.id}
              data-node="true"
              onPointerDown={(e) => startNodeDrag(e, n.id)}
              style={{
                position: 'absolute',
                left: n.x,
                top: n.y,
                width: NODE_W,
                height: NODE_H,
                transform: 'translate(-50%, -50%)',
                background: '#161624',
                border: `1.5px solid ${selectedId === n.id ? accent : hexToRgba(n.color, 0.7)}`,
                borderRadius: 8,
                boxShadow: selectedId === n.id ? `0 0 0 2px ${hexToRgba(accent, 0.3)}` : '0 4px 12px rgba(0,0,0,0.4)',
                cursor: 'move',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, flexShrink: 0, marginRight: 8 }}
              />
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {n.title}
              </div>
              {/* input port (left) */}
              <div
                onPointerUp={(e) => finishConnect(e, n.id)}
                style={{
                  position: 'absolute',
                  left: -5,
                  top: '50%',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  transform: 'translateY(-50%)',
                  background: '#0c0c16',
                  border: `2px solid ${hexToRgba(n.color, 0.9)}`,
                  cursor: 'crosshair',
                }}
              />
              {/* output port (right) */}
              <div
                onPointerDown={(e) => startConnect(e, n.id)}
                style={{
                  position: 'absolute',
                  right: -5,
                  top: '50%',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  transform: 'translateY(-50%)',
                  background: accent,
                  border: `2px solid ${hexToRgba(n.color, 0.9)}`,
                  cursor: 'crosshair',
                }}
              />
            </div>
          ))}
        </div>

        {/* selection config panel */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 200,
              background: '#12121f',
              border: `1px solid ${hexToRgba(accent, 0.4)}`,
              borderRadius: 8,
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              zIndex: 5,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>节点设置</div>
            <label style={{ fontSize: 11, color: '#9a9ab0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              名称
              <input
                value={selected.title}
                onChange={(e) =>
                  setNodes((prev) => prev.map((n) => (n.id === selected.id ? { ...n, title: e.target.value } : n)))
                }
                style={inputStyle}
              />
            </label>
            <label style={{ fontSize: 11, color: '#9a9ab0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              颜色
              <input
                type="color"
                value={selected.color}
                onChange={(e) =>
                  setNodes((prev) => prev.map((n) => (n.id === selected.id ? { ...n, color: e.target.value } : n)))
                }
                style={{ width: '100%', height: 28, padding: 0, border: 'none', background: 'transparent' }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

function btnStyle(accent: string, disabled = false): React.CSSProperties {
  return {
    padding: '4px 12px',
    fontSize: 12,
    borderRadius: 6,
    border: `1px solid ${hexToRgba(accent, 0.5)}`,
    background: disabled ? '#1a1a28' : hexToRgba(accent, 0.18),
    color: disabled ? '#666' : '#e8e8f0',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

const inputStyle: React.CSSProperties = {
  background: '#1a1a28',
  border: '1px solid #2c2c3e',
  borderRadius: 6,
  color: '#e8e8f0',
  padding: '4px 8px',
  fontSize: 12,
}

export const Preview: ExperimentModule['Preview'] = (props) => <StaticGraph config={props.config} />
export const Renderer: ExperimentModule['Renderer'] = (props) => <NodeEditor {...props} />

const module: ExperimentModule = { Preview, Renderer }
export default module
export { definition }
