import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import type { ExperimentModule, ExperimentComponentProps } from '@/experiments/shared/types'
import { definition } from './meta'

interface SceneProps {
  config: Record<string, any>
  preview?: boolean
}

interface CardItem {
  index: number
  angle: number
  color: THREE.Color
  width: number
  height: number
}

interface CardProps {
  ringRef: { current: THREE.Group | null }
  angle: number
  radius: number
  width: number
  height: number
  color: THREE.Color
  active: boolean
  onClick: () => void
}

function Card({ ringRef, angle, radius, width, height, color, active, onClick }: CardProps) {
  const group = useRef<THREE.Group>(null)
  const mat = useRef<THREE.MeshStandardMaterial>(null)

  useFrame((_, delta) => {
    const ring = ringRef.current
    const g = group.current
    if (!ring || !g || !mat.current) return
    const worldAngle = ring.rotation.y + angle
    const front = (Math.cos(worldAngle) + 1) / 2 // 0..1, 1 = facing camera
    const targetOpacity = active ? 1 : 0.5 + 0.5 * front
    mat.current.opacity = THREE.MathUtils.damp(mat.current.opacity, targetOpacity, 8, delta)
    mat.current.emissiveIntensity = THREE.MathUtils.damp(
      mat.current.emissiveIntensity,
      active ? 0.7 : 0.05 + 0.55 * front,
      8,
      delta,
    )
    const targetScale = active ? 1.18 : 1
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetScale, 8, delta))
  })

  return (
    <group
      ref={group}
      position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]}
      rotation={[0, angle, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <RoundedBox args={[width, height, 0.14]} radius={0.06} smoothness={4}>
        <meshStandardMaterial
          ref={mat}
          color={color}
          metalness={0.35}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={0.2}
          transparent
          opacity={1}
        />
      </RoundedBox>
    </group>
  )
}

function Ring({ config, preview }: SceneProps) {
  const count = Math.max(3, Math.min(12, Math.round(Number(config.cardCount) || 8)))
  const radius = Number(config.radius) || 3.2
  const spacing = Number(config.cardSpacing) ?? 0.15
  const sensitivity = Number(config.dragSensitivity) || 1
  const accent = config.accentColor ?? '#7c6cff'

  const ringRef = useRef<THREE.Group>(null)
  const targetRotY = useRef(0)
  const dragging = useRef(false)
  const lastX = useRef(0)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const gl = useThree((s) => s.gl)

  const cards = useMemo<CardItem[]>(() => {
    const base = new THREE.Color(accent)
    const arc = (Math.PI * 2 * radius) / count
    const width = THREE.MathUtils.clamp(arc - spacing, 0.35, 4)
    const height = 1.7
    const list: CardItem[] = []
    for (let i = 0; i < count; i++) {
      const color = base.clone()
      color.offsetHSL((i / count) * 0.85, 0.08, 0.12 * Math.sin(i * 1.9))
      list.push({ index: i, angle: (i / count) * Math.PI * 2, color, width, height })
    }
    return list
  }, [count, radius, spacing, accent])

  useEffect(() => {
    if (preview) return
    const el = gl.domElement
    const down = (e: PointerEvent) => {
      dragging.current = true
      lastX.current = e.clientX
    }
    const move = (e: PointerEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastX.current
      lastX.current = e.clientX
      targetRotY.current += dx * 0.005 * sensitivity
    }
    const up = () => {
      dragging.current = false
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [gl, preview, sensitivity])

  useFrame((_, delta) => {
    const g = ringRef.current
    if (!g) return
    if (config.autoRotate && !dragging.current) {
      targetRotY.current += (Number(config.rotationSpeed) || 0) * delta * (preview ? 0.5 : 1)
    }
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetRotY.current, 6, delta)
  })

  const handleClick = (index: number) => {
    if (activeIndex === index) {
      setActiveIndex(null)
      return
    }
    setActiveIndex(index)
    const angle = (index / count) * Math.PI * 2
    let target = -angle
    const current = ringRef.current?.rotation.y ?? 0
    while (target - current > Math.PI) target -= Math.PI * 2
    while (target - current < -Math.PI) target += Math.PI * 2
    targetRotY.current = target
  }

  return (
    <group ref={ringRef}>
      {cards.map((c) => (
        <Card
          key={c.index}
          ringRef={ringRef}
          angle={c.angle}
          radius={radius}
          width={c.width}
          height={c.height}
          color={c.color}
          active={activeIndex === c.index}
          onClick={() => handleClick(c.index)}
        />
      ))}
    </group>
  )
}

function CameraRig({ perspective }: { perspective: number }) {
  const camera = useThree((s) => s.camera)
  useFrame((_, delta) => {
    const targetZ = perspective / 140 + 2
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 5, delta)
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Scene({ config, preview }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 5]} intensity={0.9} />
      <pointLight position={[-4, 2, -3]} intensity={0.7} color={config.accentColor ?? '#7c6cff'} />
      <Ring config={config} preview={preview} />
      {!preview && (
        <ContactShadows
          position={[0, -2.3, 0]}
          opacity={0.4}
          scale={12}
          blur={2.4}
          far={4}
          color="#000000"
        />
      )}
    </>
  )
}

function Stage({ config, preview }: ExperimentComponentProps) {
  const bg = config.backgroundColor ?? '#0b0b18'
  const perspective = Number(config.perspective) || 900
  return (
    <Canvas
      dpr={preview ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 0.4, perspective / 140 + 2], fov: 45 }}
      gl={{ antialias: !preview, alpha: false }}
      style={{ background: bg }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(bg))
      }}
    >
      <Scene config={config} preview={preview} />
      <CameraRig perspective={perspective} />
    </Canvas>
  )
}

export const Preview: ExperimentModule['Preview'] = (props) => <Stage {...props} preview />
export const Renderer: ExperimentModule['Renderer'] = (props) => <Stage {...props} preview={false} />

const module: ExperimentModule = { Preview, Renderer }
export default module
export { definition }
