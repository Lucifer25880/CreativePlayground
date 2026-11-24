import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { ComponentType } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { ExperimentComponentProps } from '@/experiments/shared/types'
import type { ExperimentConfig } from '@/types/config'
import { definition } from './meta'

/* Deterministic seeded PRNG so the scattered world is stable per count. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Instance {
  x: number
  y: number
  z: number
  rotY: number
  sx: number
  sy: number
  sz: number
}

interface WorldData {
  boxes: Instance[]
  cylinders: Instance[]
  trunks: Instance[]
  cones: Instance[]
  accents: Instance[]
}

function generateWorld(count: number): WorldData {
  const rand = mulberry32(20260101)
  const R = 22
  const randPos = () => ({
    x: (rand() * 2 - 1) * R,
    z: (rand() * 2 - 1) * R,
    rotY: rand() * Math.PI * 2,
  })

  const boxCount = Math.round(count * 0.3)
  const cylCount = Math.round(count * 0.25)
  const treeCount = Math.round(count * 0.35)
  const accentCount = Math.max(1, Math.round(count * 0.1))

  const boxes: Instance[] = []
  for (let i = 0; i < boxCount; i++) {
    const p = randPos()
    const k = 0.6 + rand() * 1.4
    const h = k * (0.8 + rand() * 0.9)
    boxes.push({ ...p, y: h / 2, sx: k, sy: h, sz: k })
  }

  const cylinders: Instance[] = []
  for (let i = 0; i < cylCount; i++) {
    const p = randPos()
    const k = 0.5 + rand() * 1.2
    const h = k * (1.2 + rand() * 1.6)
    cylinders.push({ ...p, y: h / 2, sx: k, sy: h, sz: k })
  }

  const trunks: Instance[] = []
  const cones: Instance[] = []
  for (let i = 0; i < treeCount; i++) {
    const p = randPos()
    const k = 0.7 + rand() * 1.5
    const trunkH = 1.6 * k
    const coneH = 1.9 * k
    trunks.push({ ...p, y: trunkH / 2, sx: 0.16 * k, sy: trunkH, sz: 0.16 * k })
    cones.push({ ...p, y: trunkH + coneH / 2, sx: 0.7 * k, sy: coneH, sz: 0.7 * k })
  }

  const accents: Instance[] = []
  for (let i = 0; i < accentCount; i++) {
    const p = randPos()
    const k = 0.5 + rand()
    const h = k * (1 + rand() * 2)
    accents.push({ ...p, y: h / 2, sx: 0.22 * k, sy: h, sz: 0.22 * k })
  }

  return { boxes, cylinders, trunks, cones, accents }
}

function Fog({ color, density }: { color: string; density: number }) {
  const { scene } = useThree()
  useEffect(() => {
    scene.fog = new THREE.FogExp2(color, density)
    return () => {
      scene.fog = null
    }
  }, [scene, color, density])
  return null
}

function Daylight({ color, speed }: { color: string; speed: number }) {
  const light = useRef<THREE.DirectionalLight>(null)
  useFrame((state) => {
    const l = light.current
    if (!l) return
    const t = state.clock.elapsedTime
    const a = t * 0.12 + Math.sin(t * speed * 0.2) * 0.35
    l.position.set(Math.cos(a) * 12, 14, Math.sin(a) * 12)
  })
  return <directionalLight ref={light} color={color} intensity={1.4} />
}

function CameraRig({ speed, preview }: { speed: number; preview: boolean }) {
  const target = useMemo(() => new THREE.Vector3(), [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const s = preview ? 0 : speed
    const angle = t * s * 0.25
    const radius = 15
    const height = 5.5 + Math.sin(t * s * 0.4) * 2.5
    state.camera.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius)
    target.set(state.pointer.x * 7, state.pointer.y * 3.5, 0)
    state.camera.lookAt(target)
  })
  return null
}

function World({ count, accent }: { count: number; accent: string }) {
  const boxRef = useRef<THREE.InstancedMesh>(null)
  const cylRef = useRef<THREE.InstancedMesh>(null)
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const coneRef = useRef<THREE.InstancedMesh>(null)
  const accentRef = useRef<THREE.InstancedMesh>(null)

  const world = useMemo(() => generateWorld(count), [count])

  useLayoutEffect(() => {
    const m4 = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scl = new THREE.Vector3()
    const up = new THREE.Vector3(0, 1, 0)
    const apply = (mesh: THREE.InstancedMesh | null, items: Instance[]) => {
      if (!mesh) return
      items.forEach((it, i) => {
        pos.set(it.x, it.y, it.z)
        quat.setFromAxisAngle(up, it.rotY)
        scl.set(it.sx, it.sy, it.sz)
        m4.compose(pos, quat, scl)
        mesh.setMatrixAt(i, m4)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    apply(boxRef.current, world.boxes)
    apply(cylRef.current, world.cylinders)
    apply(trunkRef.current, world.trunks)
    apply(coneRef.current, world.cones)
    apply(accentRef.current, world.accents)
  }, [world])

  return (
    <group>
      <instancedMesh ref={boxRef} args={[undefined, undefined, world.boxes.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#3a4160" roughness={0.7} metalness={0.15} />
      </instancedMesh>
      <instancedMesh ref={cylRef} args={[undefined, undefined, world.cylinders.length]}>
        <cylinderGeometry args={[1, 1, 1, 12]} />
        <meshStandardMaterial color="#4a5170" roughness={0.6} metalness={0.2} />
      </instancedMesh>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, world.trunks.length]}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#5a4632" roughness={0.9} metalness={0.05} />
      </instancedMesh>
      <instancedMesh ref={coneRef} args={[undefined, undefined, world.cones.length]}>
        <coneGeometry args={[1, 1, 10]} />
        <meshStandardMaterial color="#3d8b6b" roughness={0.8} metalness={0.05} />
      </instancedMesh>
      <instancedMesh ref={accentRef} args={[undefined, undefined, world.accents.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} />
      </instancedMesh>
    </group>
  )
}

function Scene({ config, preview = false }: { config: ExperimentConfig; preview?: boolean }) {
  const count = preview
    ? Math.max(10, Math.round(Number(config.objectCount) * 0.4))
    : Number(config.objectCount)
  const sceneScale = Number(config.sceneScale)
  const accent = String(config.accentColor ?? '#7c6cff')
  const daylight = String(config.daylightColor ?? '#ffffff')
  const ambient = Number(config.ambientLight)

  return (
    <>
      <Fog color="#0a0c18" density={Number(config.fogDensity)} />
      <ambientLight intensity={ambient} />
      <hemisphereLight args={['#223055', '#0a0c16', ambient * 0.5]} />
      <Daylight color={daylight} speed={Number(config.cameraSpeed)} />

      <group scale={sceneScale}>
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#0c0e1a" roughness={1} metalness={0} />
        </mesh>
        <gridHelper args={[80, 80, '#4a5a8a', '#1b2136']} position={[0, 0, 0]} />
        <World count={count} accent={accent} />
      </group>

      <Stars radius={80} depth={30} count={preview ? 1000 : 3000} factor={4} saturation={0} fade speed={0.6} />

      <CameraRig speed={Number(config.cameraSpeed)} preview={preview} />
    </>
  )
}

function Stage(props: ExperimentComponentProps & { preview?: boolean }) {
  const { config, preview = false } = props
  const bg = '#070812'
  return (
    <Canvas
      dpr={preview ? [1, 1.5] : [1, 2]}
      camera={{ position: [15, 6, 15], fov: 50, near: 0.1, far: 200 }}
      gl={{ antialias: !preview, alpha: false }}
      style={{ background: bg }}
      onCreated={({ gl }) => gl.setClearColor(new THREE.Color(bg))}
    >
      <Scene config={config} preview={preview} />
    </Canvas>
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
