import { useCallback, useEffect, useRef } from 'react'
import type { ExperimentModule, ExperimentComponentProps } from '@/experiments/shared/types'
import { useElementSize } from '@/experiments/shared/useElementSize'
import { useAnimationFrame } from '@/experiments/shared/useAnimationFrame'
import { definition } from './meta'

/* ------------------------------ deterministic data ------------------------------ */

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function generateData(seed: number, count: number): number[] {
  const rnd = mulberry32(seed)
  const phase = rnd() * Math.PI * 2
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    const v = 0.5 + 0.32 * Math.sin(i * 0.45 + phase) + (rnd() - 0.5) * 0.3
    out.push(Math.max(0.02, Math.min(1, v)))
  }
  return out
}

/* ----------------------------------- helpers ----------------------------------- */

function hexToRgb(hex: string) {
  const h = (hex || '#7c6cff').replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return {
    r: parseInt(f.slice(0, 2), 16) || 0,
    g: parseInt(f.slice(2, 4), 16) || 0,
    b: parseInt(f.slice(4, 6), 16) || 0,
  }
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

function adjustLight(hex: string, delta: number) {
  const { r, g, b } = hexToRgb(hex)
  const f = 1 + delta
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)))
  return `rgb(${c(r)},${c(g)},${c(b)})`
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

type Palette = { bg: string; panel: string; grid: string; text: string; sub: string; axis: string }

const palettes: Record<string, Palette> = {
  dark: { bg: '#0b0b18', panel: '#131327', grid: '#20203a', text: '#e8e8f0', sub: '#8a8aa5', axis: '#2a2a45' },
  light: { bg: '#f5f6fb', panel: '#ffffff', grid: '#e4e6f0', text: '#1a1a28', sub: '#6a6a80', axis: '#d6d8e4' },
  cyber: { bg: '#07020f', panel: '#120a26', grid: '#25113f', text: '#00ffd0', sub: '#6fe0cf', axis: '#2b1650' },
}

function smoothPath(ctx: CanvasRenderingContext2D, pts: Array<[number, number]>) {
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i][0] + pts[i + 1][0]) / 2
    const yc = (pts[i][1] + pts[i + 1][1]) / 2
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc)
  }
  if (pts.length > 1) ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1])
}

/* ---------------------------------- component ---------------------------------- */

function DataDashboard({ config, preview }: ExperimentComponentProps) {
  const { ref, size } = useElementSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const chartType = config.chartType ?? 'area'
  const theme = config.theme ?? 'dark'
  const accent = config.accentColor ?? '#7c6cff'
  const density = Math.max(2, Math.round(Number(config.dataDensity) || 32))
  const animDur = Math.max(0, Number(config.animationDuration) || 0)
  const refreshInterval = Math.max(0, Number(config.refreshInterval) || 0)

  const displayRef = useRef<number[]>([])
  const fromRef = useRef<number[]>([])
  const toRef = useRef<number[]>([])
  const elapsedRef = useRef(9999)
  const seedRef = useRef(1)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)

  const ensureData = useCallback(() => {
    if (displayRef.current.length !== density) {
      const arr = generateData(seedRef.current++, density)
      displayRef.current = arr.slice()
      fromRef.current = arr.slice()
      toRef.current = arr.slice()
      elapsedRef.current = 9999
    }
  }, [density])

  const refresh = useCallback(() => {
    ensureData()
    const target = generateData(seedRef.current++, density)
    fromRef.current = displayRef.current.slice()
    toRef.current = target
    elapsedRef.current = 0
  }, [density, ensureData])

  // data generation interval
  useEffect(() => {
    if (preview) return
    ensureData()
    if (refreshInterval <= 0) return
    const id = setInterval(refresh, refreshInterval * 1000)
    return () => clearInterval(id)
  }, [refreshInterval, refresh, ensureData, preview])

  // draw (uses latest closure via the RAF callback ref)
  function draw() {
    ensureData()
    const canvas = canvasRef.current
    if (!canvas || size.width <= 0 || size.height <= 0) return
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

    const pal = palettes[theme] || palettes.dark
    const vals = displayRef.current

    // background
    ctx.fillStyle = pal.bg
    ctx.fillRect(0, 0, w, h)

    const pad = 12
    const gap = 10
    const headerH = 92
    const panelW = (w - pad * 2 - gap * 2) / 3

    // ---------- three linked panels ----------
    const drawPanel = (x: number, wd: number, title: string) => {
      ctx.fillStyle = pal.panel
      rr(ctx, x, pad, wd, headerH, 10)
      ctx.fill()
      ctx.strokeStyle = rgba(accent, 0.35)
      ctx.lineWidth = 1
      rr(ctx, x, pad, wd, headerH, 10)
      ctx.stroke()
      ctx.fillStyle = pal.sub
      ctx.font = '10px system-ui, sans-serif'
      ctx.fillText(title, x + 12, pad + 16)
    }

    // 1) headline number
    drawPanel(pad, panelW, '实时总量')
    {
      const sum = vals.reduce((a, b) => a + b, 0)
      ctx.fillStyle = pal.text
      ctx.font = '700 24px system-ui, sans-serif'
      ctx.fillText((sum * 10).toFixed(1) + 'k', pad + 12, pad + 46)
      ctx.fillStyle = accent
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('▲ 联动更新中', pad + 12, pad + 68)
    }

    // 2) sparkline
    drawPanel(pad + panelW + gap, panelW, '趋势')
    {
      const sp = vals.slice(0, Math.min(40, vals.length))
      const x0 = pad + panelW + gap + 8
      const w0 = panelW - 16
      const h0 = headerH - 28
      ctx.strokeStyle = rgba(accent, 0.2)
      ctx.lineWidth = 1
      for (let i = 0; i < 3; i++) {
        const yy = pad + 26 + (h0 / 4) * (i + 1)
        ctx.beginPath()
        ctx.moveTo(x0, yy)
        ctx.lineTo(x0 + w0, yy)
        ctx.stroke()
      }
      const pts: Array<[number, number]> = sp.map((v, i) => [
        x0 + (i / (sp.length - 1)) * w0,
        pad + 26 + h0 - v * h0,
      ])
      smoothPath(ctx, pts)
      ctx.strokeStyle = accent
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // 3) mini bar
    drawPanel(pad + (panelW + gap) * 2, panelW, '分布')
    {
      const bars = vals.slice(-8)
      const x0 = pad + (panelW + gap) * 2 + 8
      const w0 = panelW - 16
      const bw = w0 / bars.length
      const base = pad + headerH - 12
      for (let i = 0; i < bars.length; i++) {
        const bh = bars[i] * (headerH - 36)
        ctx.fillStyle = i % 2 === 0 ? accent : rgba(accent, 0.5)
        ctx.fillRect(x0 + i * bw + bw * 0.18, base - bh, bw * 0.64, bh)
      }
    }

    // ---------- main chart ----------
    const chartY = pad + headerH + gap
    const chartX = pad
    const chartW = w - pad * 2
    const chartH = h - chartY - pad
    if (chartH > 40) {
      // panel background for the chart
      ctx.fillStyle = pal.panel
      rr(ctx, chartX, chartY, chartW, chartH, 10)
      ctx.fill()
      ctx.strokeStyle = rgba(accent, 0.3)
      ctx.lineWidth = 1
      rr(ctx, chartX, chartY, chartW, chartH, 10)
      ctx.stroke()

      const padL = 44
      const padR = 14
      const padT = 20
      const padB = 26
      const plotW = chartW - padL - padR
      const plotH = chartH - padT - padB
      const x0 = chartX + padL
      const y0 = chartY + padT

      // grid + y axis labels
      ctx.fillStyle = pal.sub
      ctx.font = '10px system-ui, sans-serif'
      ctx.strokeStyle = pal.grid
      ctx.lineWidth = 1
      for (let g = 0; g <= 4; g++) {
        const yy = y0 + plotH - (plotH / 4) * g
        ctx.beginPath()
        ctx.moveTo(x0, yy)
        ctx.lineTo(x0 + plotW, yy)
        ctx.stroke()
        ctx.fillText(((g / 4) * 100).toFixed(0), chartX + 8, yy + 3)
      }

      if (chartType === 'pie' || chartType === 'donut') {
        const cx = x0 + plotW / 2
        const cy = y0 + plotH / 2
        const slices = vals.slice(0, Math.min(10, vals.length))
        const total = slices.reduce((a, b) => a + b, 0) || 1
        const outer = Math.min(plotW, plotH) / 2 - 10
        const inner = chartType === 'donut' ? outer * 0.55 : 0
        let a = -Math.PI / 2
        for (let i = 0; i < slices.length; i++) {
          const sweep = (slices[i] / total) * Math.PI * 2
          ctx.beginPath()
          ctx.moveTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer)
          ctx.arc(cx, cy, outer, a, a + sweep)
          if (inner > 0) {
            ctx.arc(cx, cy, inner, a + sweep, a, true)
          }
          ctx.closePath()
          ctx.fillStyle = adjustLight(accent, (i / (slices.length - 1 || 1) - 0.5) * 0.7)
          ctx.fill()
          ctx.strokeStyle = pal.panel
          ctx.lineWidth = 2
          ctx.stroke()
          a += sweep
        }
        if (inner > 0) {
          ctx.beginPath()
          ctx.arc(cx, cy, inner, 0, Math.PI * 2)
          ctx.fillStyle = pal.panel
          ctx.fill()
        }
      } else if (chartType === 'bar') {
        const n = vals.length
        const bw = (plotW / n) * 0.68
        const base = y0 + plotH
        const pointer = pointerRef.current
        let hoverIdx = -1
        if (pointer && pointer.x >= x0 && pointer.x <= x0 + plotW && pointer.y >= y0 && pointer.y <= base) {
          hoverIdx = Math.round(((pointer.x - x0) / plotW) * (n - 1))
        }
        for (let i = 0; i < n; i++) {
          const x = x0 + (i / (n - 1)) * plotW
          const bh = vals[i] * plotH
          const hot = i === hoverIdx
          ctx.fillStyle = hot ? adjustLight(accent, 0.25) : accent
          ctx.fillRect(x - bw / 2, base - bh, bw, bh)
        }
        if (hoverIdx >= 0) {
          const x = x0 + (hoverIdx / (n - 1)) * plotW
          drawTooltip(ctx, pal, accent, x, base - vals[hoverIdx] * plotH, vals[hoverIdx])
        }
      } else {
        // line / area
        const pts: Array<[number, number]> = vals.map((v, i) => [
          x0 + (i / (vals.length - 1)) * plotW,
          y0 + plotH - v * plotH,
        ])
        if (chartType === 'area') {
          smoothPath(ctx, pts)
          ctx.lineTo(pts[pts.length - 1][0], y0 + plotH)
          ctx.lineTo(pts[0][0], y0 + plotH)
          ctx.closePath()
          const grad = ctx.createLinearGradient(0, y0, 0, y0 + plotH)
          grad.addColorStop(0, rgba(accent, 0.5))
          grad.addColorStop(1, rgba(accent, 0.02))
          ctx.fillStyle = grad
          ctx.fill()
        }
        smoothPath(ctx, pts)
        ctx.strokeStyle = accent
        ctx.lineWidth = 2.5
        ctx.lineJoin = 'round'
        ctx.stroke()

        const pointer = pointerRef.current
        if (pointer && pointer.x >= x0 && pointer.x <= x0 + plotW && pointer.y >= y0 && pointer.y <= y0 + plotH) {
          const idx = Math.max(0, Math.min(vals.length - 1, Math.round(((pointer.x - x0) / plotW) * (vals.length - 1))))
          drawTooltip(ctx, pal, accent, pts[idx][0], pts[idx][1], vals[idx])
        }
      }
    }
  }

  function drawTooltip(
    ctx: CanvasRenderingContext2D,
    pal: Palette,
    accent: string,
    x: number,
    y: number,
    v: number,
  ) {
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fillStyle = accent
    ctx.fill()
    const label = (v * 100).toFixed(0) + '%'
    ctx.font = '11px system-ui, sans-serif'
    const tw = ctx.measureText(label).width
    ctx.fillStyle = pal.text
    rr(ctx, x + 8, y - 16, tw + 12, 18, 4)
    ctx.fill()
    ctx.fillStyle = pal.bg
    ctx.fillText(label, x + 14, y - 3)
  }

  // animation loop (renderer only)
  useAnimationFrame((dt) => {
    if (elapsedRef.current < animDur) elapsedRef.current += dt
    const p = animDur <= 0 ? 1 : Math.min(1, elapsedRef.current / animDur)
    const eased = 1 - Math.pow(1 - p, 3)
    const from = fromRef.current
    const to = toRef.current
    const disp = displayRef.current
    for (let i = 0; i < disp.length; i++) {
      disp[i] = from[i] + (to[i] - from[i]) * eased
    }
    draw()
  }, !preview)

  // static single draw for preview (and first paint)
  useEffect(() => {
    if (preview) {
      ensureData()
      elapsedRef.current = 9999
      draw()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, chartType, theme, accent, density, size.width, size.height])

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    pointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  return (
    <div
      ref={ref}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: (palettes[theme] || palettes.dark).bg }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        onPointerMove={onPointerMove}
        onPointerLeave={() => (pointerRef.current = null)}
      />
      {!preview && (
        <button
          onClick={refresh}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 8,
            border: `1px solid ${rgba(accent, 0.6)}`,
            background: rgba(accent, 0.2),
            color: (palettes[theme] || palettes.dark).text,
            cursor: 'pointer',
          }}
        >
          ⟳ 刷新
        </button>
      )}
    </div>
  )
}

export const Preview: ExperimentModule['Preview'] = (props) => <DataDashboard {...props} preview />
export const Renderer: ExperimentModule['Renderer'] = (props) => <DataDashboard {...props} />

const module: ExperimentModule = { Preview, Renderer }
export default module
export { definition }
