import { useEffect, useRef } from 'react'
import type { ComponentType } from 'react'
import type { ExperimentComponentProps } from '@/experiments/shared/types'
import { useAnimationFrame } from '@/experiments/shared/useAnimationFrame'
import { useElementSize } from '@/experiments/shared/useElementSize'
import { usePointerNormalized } from '@/experiments/shared/usePointer'
import { definition } from './meta'

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

/** Paint the procedural "image" onto an offscreen canvas at reduced resolution. */
function drawSource(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#141428')
  g.addColorStop(0.5, '#1d1d3a')
  g.addColorStop(1, '#0c0c1e')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const rg = ctx.createRadialGradient(w * 0.7, h * 0.3, 0, w * 0.7, h * 0.3, Math.max(w, h) * 0.9)
  rg.addColorStop(0, hexToRgba(accent, 0.26))
  rg.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = rg
  ctx.fillRect(0, 0, w, h)

  const min = Math.min(w, h)
  for (let i = 0; i < 6; i++) {
    const r = min * (0.12 + i * 0.13)
    ctx.strokeStyle = hexToRgba(accent, Math.max(0.05, 0.28 - i * 0.035))
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(w * 0.5, h * 0.5, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  for (let x = -h; x < w + h; x += 14) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + h, h)
    ctx.stroke()
  }
  ctx.restore()

  ctx.fillStyle = hexToRgba(accent, 0.95)
  ctx.font = `700 ${Math.round(min * 0.13)}px system-ui, -apple-system, Segoe UI, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('LIQUIFY', w / 2, h / 2 - min * 0.02)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = `600 ${Math.round(min * 0.05)}px system-ui, sans-serif`
  ctx.fillText('DRAG TO DISTORT', w / 2, h / 2 + min * 0.08)
}

/** Add a tangential swirl displacement into the offset field within radius R. */
function applySwirl(
  dx: Float32Array,
  dy: Float32Array,
  W: number,
  H: number,
  px: number,
  py: number,
  R: number,
  strength: number,
) {
  const x0 = Math.max(0, Math.floor(px - R))
  const x1 = Math.min(W - 1, Math.ceil(px + R))
  const y0 = Math.max(0, Math.floor(py - R))
  const y1 = Math.min(H - 1, Math.ceil(py + R))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const ddx = x - px
      const ddy = y - py
      const d = Math.hypot(ddx, ddy)
      if (d < R && d > 0.0001) {
        const falloff = Math.pow(1 - d / R, 2)
        const a = Math.atan2(ddy, ddx)
        const i = y * W + x
        dx[i] += -Math.sin(a) * strength * falloff
        dy[i] += Math.cos(a) * strength * falloff
      }
    }
  }
}

function Stage({ config, preview }: ExperimentComponentProps) {
  const { ref, size } = useElementSize<HTMLDivElement>()
  const { ref: pointerRef, pos } = usePointerNormalized<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragging = useRef(false)

  const srcCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const srcCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const srcDataRef = useRef<ImageData | null>(null)
  const outCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const outCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const outDataRef = useRef<ImageData | null>(null)
  const dispX = useRef<Float32Array | null>(null)
  const dispY = useRef<Float32Array | null>(null)
  const velX = useRef<Float32Array | null>(null)
  const velY = useRef<Float32Array | null>(null)
  const dimsRef = useRef({ w: 0, h: 0 })
  const dprRef = useRef(1)
  const lastSwirl = useRef(0)

  const accentColor = String(config.accentColor ?? '#7c6cff')
  const distortionRadius = Number(config.distortionRadius ?? 80)
  const distortionStrength = Number(config.distortionStrength ?? 1)
  const recoverySpeed = Number(config.recoverySpeed ?? 0.08)
  const elasticity = Number(config.elasticity ?? 0.5)
  const showGrid = !!config.showGrid

  const setRef = (el: HTMLDivElement | null) => {
    ref.current = el
    pointerRef.current = el
  }

  // pointer drag tracking
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const down = () => {
      dragging.current = true
    }
    const up = () => {
      dragging.current = false
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  // allocate internal buffers at reduced resolution on size change
  useEffect(() => {
    const w = size.width
    const h = size.height
    if (!w || !h) return
    const scale = preview ? 0.35 : 0.5
    const W = Math.max(2, Math.round(w * scale))
    const H = Math.max(2, Math.round(h * scale))
    dimsRef.current = { w: W, h: H }
    dispX.current = new Float32Array(W * H)
    dispY.current = new Float32Array(W * H)
    velX.current = new Float32Array(W * H)
    velY.current = new Float32Array(W * H)

    let src = srcCanvasRef.current
    if (!src) {
      src = document.createElement('canvas')
      srcCanvasRef.current = src
    }
    src.width = W
    src.height = H
    const sctx = src.getContext('2d')
    if (sctx) {
      srcCtxRef.current = sctx
      drawSource(sctx, W, H, accentColor)
      srcDataRef.current = sctx.getImageData(0, 0, W, H)
    }

    let out = outCanvasRef.current
    if (!out) {
      out = document.createElement('canvas')
      outCanvasRef.current = out
    }
    out.width = W
    out.height = H
    const octx = out.getContext('2d')
    if (octx) {
      outCtxRef.current = octx
      outDataRef.current = octx.createImageData(W, H)
    }

    // visible canvas size + DPR
    const c = canvasRef.current
    if (c) {
      const dpr = preview
        ? Math.min(window.devicePixelRatio || 1, 1.5)
        : Math.min(window.devicePixelRatio || 1, 2)
      dprRef.current = dpr
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
    }

    // pre-apply a few swirls in preview so there is something to recover from
    if (preview) {
      const dx = dispX.current
      const dy = dispY.current
      if (dx && dy) {
        applySwirl(dx, dy, W, H, W * 0.5, H * 0.5, Math.max(10, distortionRadius * scale), distortionStrength * 20)
        applySwirl(dx, dy, W, H, W * 0.35, H * 0.6, Math.max(10, distortionRadius * scale * 0.8), distortionStrength * 14)
        applySwirl(dx, dy, W, H, W * 0.65, H * 0.4, Math.max(10, distortionRadius * scale * 0.8), distortionStrength * 14)
      }
      lastSwirl.current = 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, preview])

  // repaint the source when the accent color changes
  useEffect(() => {
    const sctx = srcCtxRef.current
    const { w, h } = dimsRef.current
    if (!sctx || !w || !h) return
    drawSource(sctx, w, h, accentColor)
    srcDataRef.current = sctx.getImageData(0, 0, w, h)
  }, [accentColor])

  useAnimationFrame((dt, elapsed) => {
    const W = dimsRef.current.w
    const H = dimsRef.current.h
    if (!W || !H) return
    const dx = dispX.current
    const dy = dispY.current
    const vx = velX.current
    const vy = velY.current
    const src = srcDataRef.current
    const out = outDataRef.current
    const outCtx = outCtxRef.current
    if (!dx || !dy || !vx || !vy || !src || !out || !outCtx) return

    const cw = size.width
    const ch = size.height
    if (!cw || !ch) return
    const scale = W / cw

    // attractor position in internal coordinates
    let px: number
    let py: number
    if (preview) {
      const t = elapsed * 0.6
      px = (Math.sin(t) * 0.5 + 0.5) * W
      py = (Math.cos(t * 0.77) * 0.5 + 0.5) * H
      if (elapsed - lastSwirl.current > 2.4) {
        lastSwirl.current = elapsed
        applySwirl(dx, dy, W, H, px, py, Math.max(10, distortionRadius * scale), distortionStrength * 16)
      }
    } else {
      px = ((pos.current.x + 1) / 2) * cw * scale
      py = ((pos.current.y + 1) / 2) * ch * scale
    }

    // apply swirl while dragging
    if (dragging.current && !preview) {
      applySwirl(dx, dy, W, H, px, py, Math.max(1, distortionRadius * scale), distortionStrength * 60 * dt)
    }

    // damped-spring recovery of the displacement field
    const omega = recoverySpeed * 50
    const stiffness = omega * omega
    const zeta = Math.max(0.05, 1 - elasticity * 0.9)
    const damping = 2 * zeta * omega
    const n = W * H
    for (let i = 0; i < n; i++) {
      const ax = -stiffness * dx[i] - damping * vx[i]
      const ay = -stiffness * dy[i] - damping * vy[i]
      vx[i] += ax * dt
      vy[i] += ay * dt
      dx[i] += vx[i] * dt
      dy[i] += vy[i] * dt
    }

    // sample source through the offset field (bilinear)
    const srcPx = src.data
    const outPx = out.data
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        let sx = x + dx[i]
        let sy = y + dy[i]
        if (sx < 0) sx = 0
        else if (sx > W - 1) sx = W - 1
        if (sy < 0) sy = 0
        else if (sy > H - 1) sy = H - 1
        const x0 = sx | 0
        const y0 = sy | 0
        const x1 = x0 < W - 1 ? x0 + 1 : x0
        const y1 = y0 < H - 1 ? y0 + 1 : y0
        const fx = sx - x0
        const fy = sy - y0
        const i00 = (y0 * W + x0) << 2
        const i10 = (y0 * W + x1) << 2
        const i01 = (y1 * W + x0) << 2
        const i11 = (y1 * W + x1) << 2
        const o = i << 2
        for (let chn = 0; chn < 3; chn++) {
          const top = srcPx[i00 + chn] * (1 - fx) + srcPx[i10 + chn] * fx
          const bot = srcPx[i01 + chn] * (1 - fx) + srcPx[i11 + chn] * fx
          outPx[o + chn] = top * (1 - fy) + bot * fy
        }
        outPx[o + 3] = 255
      }
    }
    outCtx.putImageData(out, 0, 0)

    // upscale to the visible canvas
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0)
    ctx.clearRect(0, 0, cw, ch)
    ctx.imageSmoothingEnabled = true
    const outCanvas = outCanvasRef.current
    if (outCanvas) ctx.drawImage(outCanvas, 0, 0, W, H, 0, 0, cw, ch)

    // grid overlay
    if (showGrid) {
      ctx.strokeStyle = hexToRgba(accentColor, 0.14)
      ctx.lineWidth = 1
      const step = 40
      for (let x = 0.5; x < cw; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, ch)
        ctx.stroke()
      }
      for (let y = 0.5; y < ch; y += step) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(cw, y)
        ctx.stroke()
      }
    }
  })

  return (
    <div
      ref={setRef}
      className="relative w-full h-full overflow-hidden"
      style={{ touchAction: 'none', background: '#0c0c1e' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ cursor: 'grab' }} />
    </div>
  )
}

export const Preview: ComponentType<ExperimentComponentProps> = (props) => <Stage {...props} preview />
export const Renderer: ComponentType<ExperimentComponentProps> = (props) => <Stage {...props} preview={false} />

export default { Preview, Renderer }
export { definition }
