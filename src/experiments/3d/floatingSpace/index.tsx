import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { ExperimentModule, ExperimentComponentProps } from '@/experiments/shared/types'
import { definition } from './meta'

interface SceneProps {
  config: Record<string, any>
  preview?: boolean
}

interface FloatObj {
  id: number
  shape: number
  pos: [number, number, number]
  scale: number
  rotSpeed: [number, number, number]
  floatSpeed: number
  phase: number
  hue: number
  metalness: number
  roughness: number
}

/** Deterministic PRNG so re-renders produce identical object placements. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function generateObjects(count: number): FloatObj[] {
  const rand = mulberry32(1337)
  const arr: FloatObj[] = []
  for (let i = 0; i < count; i++) {
    arr.push({
      id: i,
      shape: Math.floor(rand() * 5),
      pos: [(rand() * 2 - 1) * 5.5, (rand() * 2 - 1) * 3.2, (rand() * 2 - 1) * 4 - 0.5],
      scale: 0.25 + rand() * 0.85,
      rotSpeed: [(rand() * 2 - 1) * 0.8, (rand() * 2 - 1) * 0.8, (rand() * 2 - 1) * 0.8],
      floatSpeed: 0.4 + rand() * 1.2,
      phase: rand() * Math.PI * 2,
      hue: rand(),
      metalness: 0.1 + rand() * 0.5,
      roughness: 0.2 + rand() * 0.6,
    })
  }
  return arr
}

function ShapeNode({ shape }: { shape: number }) {
  switch (shape) {
    case 0:
      return <boxGeometry args={[1, 1, 1]} />
    case 1:
      return <sphereGeometry args={[0.6, 32, 32]} />
    case 2:
      return <torusGeometry args={[0.55, 0.22, 16, 48]} />
    default:
      return <octahedronGeometry args={[0.7, 0]} />
  }
}

function FloatingObject({
  obj,
  floatSpeed,
  floatAmplitude,
  color,
}: {
  obj: FloatObj
  floatSpeed: number
  floatAmplitude: number
  color: THREE.Color
}) {
  const group = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    g.position.y = obj.pos[1] + Math.sin(t * floatSpeed * obj.floatSpeed + obj.phase) * floatAmplitude
    g.rotation.x += obj.rotSpeed[0] * floatSpeed * delta
    g.rotation.y += obj.rotSpeed[1] * floatSpeed * delta
    g.rotation.z += obj.rotSpeed[2] * floatSpeed * delta
  })

  const material = (
    <meshStandardMaterial
      color={color}
      metalness={obj.metalness}
      roughness={obj.roughness}
      emissive={color}
      emissiveIntensity={0.15}
    />
  )

  return (
    <group ref={group} position={[obj.pos[0], obj.pos[1], obj.pos[2]]}>
      <group scale={obj.scale}>
        {obj.shape === 4 ? (
          <RoundedBox args={[1, 1, 1]} radius={0.18} smoothness={4}>
            {material}
          </RoundedBox>
        ) : (
          <mesh>
            <ShapeNode shape={obj.shape} />
            {material}
          </mesh>
        )}
      </group>
    </group>
  )
}

function Field({ config, preview }: SceneProps) {
  const requested = Math.max(3, Math.min(30, Math.round(Number(config.objectCount) || 12)))
  const count = preview ? Math.min(requested, 6) : requested
  const floatSpeed = Number(config.floatSpeed) || 0.5
  const floatAmplitude = Number(config.floatAmplitude) ?? 0.8
  const accent = config.accentColor ?? '#ff5ca8'

  const objects = useMemo(() => generateObjects(count), [count])
  const base = useMemo(() => new THREE.Color(accent), [accent])

  return (
    <>
      {objects.map((obj) => {
        const color = base.clone()
        color.offsetHSL((obj.hue - 0.5) * 0.5, 0.05, (obj.hue - 0.5) * 0.25)
        return (
          <FloatingObject
            key={obj.id}
            obj={obj}
            floatSpeed={floatSpeed}
            floatAmplitude={floatAmplitude}
            color={color}
          />
        )
      })}
    </>
  )
}

function OrbitLight({ intensity, color, preview }: { intensity: number; color: string; preview?: boolean }) {
  const ref = useRef<THREE.PointLight>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime * (preview ? 0.4 : 0.7)
    ref.current?.position.set(Math.cos(t) * 4.5, Math.sin(t * 0.9) * 3, Math.sin(t) * 4.5)
  })
  return <pointLight ref={ref} intensity={intensity} color={color} />
}

function CameraRig({ cameraDepth, parallaxStrength }: { cameraDepth: number; parallaxStrength: number }) {
  const camera = useThree((s) => s.camera)
  useFrame((state, delta) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, state.pointer.x * parallaxStrength * 1.6, 4, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, state.pointer.y * parallaxStrength * 1.1, 4, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraDepth, 5, delta)
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Fog({ color, near, far }: { color: string; near: number; far: number }) {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    if (!scene.fog) {
      scene.fog = new THREE.Fog(new THREE.Color(color), near, far)
    } else {
      scene.fog.color.set(color)
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.near = near
        scene.fog.far = far
      }
    }
  }, [scene, color, near, far])
  return null
}

function Scene({ config, preview }: SceneProps) {
  const cameraDepth = Number(config.cameraDepth) || 9
  const bg = config.backgroundColor ?? '#0a0a18'
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 6, 5]} intensity={0.4} />
      <OrbitLight
        intensity={Number(config.lightIntensity)}
        color={config.accentColor ?? '#ff5ca8'}
        preview={preview}
      />
      <Field config={config} preview={preview} />
      <Fog color={bg} near={cameraDepth * 0.3} far={cameraDepth + 8} />
    </>
  )
}

function Stage({ config, preview }: ExperimentComponentProps) {
  const bg = config.backgroundColor ?? '#0a0a18'
  const cameraDepth = Number(config.cameraDepth) || 9
  const parallaxStrength = Number(config.parallaxStrength) ?? 1
  return (
    <Canvas
      dpr={preview ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 0, cameraDepth], fov: 50 }}
      gl={{ antialias: !preview, alpha: false }}
      style={{ background: bg }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(bg))
      }}
    >
      <Scene config={config} preview={preview} />
      <CameraRig cameraDepth={cameraDepth} parallaxStrength={parallaxStrength} />
    </Canvas>
  )
}

export const Preview: ExperimentModule['Preview'] = (props) => <Stage {...props} preview />
export const Renderer: ExperimentModule['Renderer'] = (props) => <Stage {...props} preview={false} />

const module: ExperimentModule = { Preview, Renderer }
export default module
export { definition }
