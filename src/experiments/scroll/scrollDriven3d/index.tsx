import { useRef } from 'react'
import type { UIEvent } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ExperimentModule, ExperimentComponentProps } from '@/experiments/shared/types'
import { useAnimationFrame } from '@/experiments/shared/useAnimationFrame'
import { useElementSize } from '@/experiments/shared/useElementSize'
import { definition } from './meta'

const DEG = Math.PI / 180

type ProgressRef = { current: { value: number } }

const SECTIONS = [
  { title: '启程', sub: '一段旅程，从静止开始。' },
  { title: '穿越', sub: '穿过光影与时间的缝隙。' },
  { title: '抵达', sub: '终点，也是新的起点。' },
]

function CameraRig({ config, progressRef }: { config: Record<string, any>; progressRef: ProgressRef }) {
  useFrame(({ camera }) => {
    const p = progressRef.current.value
    const cd = Number(config.cameraDistance)
    camera.position.z = THREE.MathUtils.lerp(cd + 4, Math.max(1, cd - 2), p)
    camera.position.y = Math.sin(p * Math.PI) * 0.7
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Object3D({
  config,
  preview,
  progressRef,
}: {
  config: Record<string, any>
  preview?: boolean
  progressRef: ProgressRef
}) {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const p = progressRef.current.value
    const rot = Number(config.rotationRange) * DEG * p
    g.rotation.x = rot * 0.8
    g.rotation.y = rot
    const pulse = p >= 0.999 ? 1 + 0.07 * Math.sin(state.clock.elapsedTime * 7) : 1
    g.scale.setScalar(pulse)
  })

  const accent = new THREE.Color(config.accentColor ?? '#7c6cff')
  const seg = preview ? 120 : 240

  return (
    <group ref={group}>
      <mesh>
        <torusKnotGeometry args={[1, 0.32, seg, 24]} />
        <meshStandardMaterial
          color={accent}
          metalness={0.45}
          roughness={0.22}
          emissive={accent}
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh scale={1.7}>
        <icosahedronGeometry args={[1, preview ? 0 : 1]} />
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.14} />
      </mesh>
      <mesh>
        <torusGeometry args={[1.42, 0.012, 8, 120]} />
        <meshBasicMaterial color={accent} transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

function Scene({
  config,
  preview,
  progressRef,
}: {
  config: Record<string, any>
  preview?: boolean
  progressRef: ProgressRef
}) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} />
      <pointLight
        position={[-4, -2, -3]}
        intensity={0.7}
        color={config.accentColor ?? '#7c6cff'}
      />
      <Object3D config={config} preview={preview} progressRef={progressRef} />
      <CameraRig config={config} progressRef={progressRef} />
    </>
  )
}

function Overlay({ progressRef, config }: { progressRef: ProgressRef; config: Record<string, any> }) {
  const titleRefs = useRef<(HTMLDivElement | null)[]>([])
  const doneRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const accent = config.accentColor ?? '#7c6cff'
  const showProgress = !!config.showProgress

  useAnimationFrame(() => {
    const p = progressRef.current.value
    const st = Number(config.sceneTransition)
    const centers = [1 / 6, 3 / 6, 5 / 6]
    const window = 0.1 + st * 0.16
    SECTIONS.forEach((_, i) => {
      const el = titleRefs.current[i]
      if (!el) return
      const d = Math.abs(p - centers[i])
      const o = Math.max(0, Math.min(1, 1 - d / window))
      el.style.opacity = String(o)
      el.style.transform = `translateY(${(1 - o) * 18}px)`
    })
    if (barRef.current) barRef.current.style.width = `${Math.min(1, p) * 100}%`
    if (doneRef.current) {
      const near = p >= 0.985
      const o = near ? Math.min(1, (p - 0.985) / 0.015) : 0
      const scale = near ? 1 + 0.05 * Math.sin(performance.now() / 130) : 0.8
      doneRef.current.style.opacity = String(o)
      doneRef.current.style.transform = `scale(${scale})`
    }
  })

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {showProgress && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'rgba(255,255,255,0.08)',
          }}
        >
          <div
            ref={barRef}
            style={{
              height: '100%',
              width: 0,
              background: accent,
              boxShadow: `0 0 12px ${accent}`,
            }}
          />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'relative', width: '80%', height: 140 }}>
          {SECTIONS.map((s, i) => (
            <div
              key={s.title}
              ref={(el) => {
                titleRefs.current[i] = el
              }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: 0,
                willChange: 'opacity, transform',
              }}
            >
              <div style={{ fontSize: 12, letterSpacing: 5, textTransform: 'uppercase', color: accent }}>
                0{i + 1}
              </div>
              <h2 style={{ margin: '4px 0', fontSize: 34, fontWeight: 700, letterSpacing: 4 }}>{s.title}</h2>
              <p style={{ margin: 0, opacity: 0.7, fontSize: 14 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
      <div
        ref={doneRef}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0,
          color: '#fff',
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: 8, color: accent }}>COMPLETE</div>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 6, marginTop: 6 }}>完成</div>
      </div>
    </div>
  )
}

function Stage({ config, preview }: ExperimentComponentProps & { preview?: boolean }) {
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>()
  const progress = useRef({ value: 0 })
  const target = useRef(0)

  useAnimationFrame((dt, elapsed) => {
    if (preview) {
      const period = 8
      const t = (elapsed % period) / period
      target.current = t < 0.5 ? t * 2 : 2 - t * 2
    }
    const k = 1 - Math.exp(-dt / Math.max(0.05, Number(config.animationDuration) * 0.25))
    progress.current.value += (target.current - progress.current.value) * k
  })

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    if (max > 0) target.current = Math.min(1, Math.max(0, el.scrollTop / max))
  }

  const viewH = size.height || 420
  const spacerH = viewH * 4

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: '#08080f',
      }}
    >
      <div style={{ height: spacerH, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: viewH, width: '100%', overflow: 'hidden' }}>
          <Canvas
            dpr={preview ? [1, 1.5] : [1, 2]}
            camera={{ position: [0, 0, 11], fov: 40 }}
            gl={{ antialias: !preview, alpha: true }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Scene config={config} preview={preview} progressRef={progress} />
          </Canvas>
          <Overlay progressRef={progress} config={config} />
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
