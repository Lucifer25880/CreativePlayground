import { useMemo, useRef } from 'react'
import type { ComponentType } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import type { ExperimentComponentProps } from '@/experiments/shared/types'
import type { ExperimentConfig } from '@/types/config'
import { definition } from './meta'

type Kind = 'box' | 'cylinder' | 'torus' | 'sphere'

interface PartSpec {
  base: [number, number, number]
  dir: [number, number, number]
  color: string
  roughness: number
  metalness: number
  baseEmissive: number
  kind: Kind
  args: number[]
  rotation?: [number, number, number]
}

function buildParts(accent: string, preview?: boolean): PartSpec[] {
  const screwDefs: Array<{ base: [number, number, number]; dir: [number, number, number] }> = [
    { base: [0.62, 0.38, 0.44], dir: [0.55, 0.34, 0.76] },
    { base: [-0.62, 0.38, 0.44], dir: [-0.55, 0.34, 0.76] },
    { base: [0.62, -0.38, 0.44], dir: [0.55, -0.34, 0.76] },
    { base: [-0.62, -0.38, 0.44], dir: [-0.55, -0.34, 0.76] },
  ]
  const screws: PartSpec[] = (preview ? screwDefs.slice(0, 2) : screwDefs).map((p) => ({
    ...p,
    color: '#6b7187',
    roughness: 0.4,
    metalness: 0.75,
    baseEmissive: 0,
    kind: 'sphere',
    args: [0.09, 20, 20],
  }))

  return [
    {
      base: [0, 0, 0],
      dir: [0, 0, 0],
      color: accent,
      roughness: 0.35,
      metalness: 0.45,
      baseEmissive: 0.18,
      kind: 'box',
      args: [1.6, 1.05, 0.85],
    },
    {
      base: [0, 0, 0.46],
      dir: [0, 0, 1],
      color: '#c9d2ea',
      roughness: 0.2,
      metalness: 0.1,
      baseEmissive: 0.2,
      kind: 'cylinder',
      args: [0.38, 0.38, 0.24, 48],
      rotation: [Math.PI / 2, 0, 0],
    },
    {
      base: [0, 0, 0.3],
      dir: [0, 0, 1],
      color: accent,
      roughness: 0.3,
      metalness: 0.5,
      baseEmissive: 0.22,
      kind: 'torus',
      args: [0.5, 0.07, 16, 64],
    },
    {
      base: [0, 0.62, 0],
      dir: [0, 1, 0],
      color: accent,
      roughness: 0.3,
      metalness: 0.5,
      baseEmissive: 0.15,
      kind: 'cylinder',
      args: [0.13, 0.13, 0.22, 24],
    },
    ...screws,
  ]
}

function PartGeometry({ spec }: { spec: PartSpec }) {
  switch (spec.kind) {
    case 'box':
      return <boxGeometry args={[spec.args[0], spec.args[1], spec.args[2]]} />
    case 'cylinder':
      return <cylinderGeometry args={[spec.args[0], spec.args[1], spec.args[2], spec.args[3]]} />
    case 'torus':
      return <torusGeometry args={[spec.args[0], spec.args[1], spec.args[2], spec.args[3]]} />
    case 'sphere':
      return <sphereGeometry args={[spec.args[0], spec.args[1], spec.args[2]]} />
  }
}

function Device({ config, preview = false }: { config: Record<string, any>; preview?: boolean }) {
  const group = useRef<THREE.Group>(null)
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const hovered = useRef<boolean[]>([])
  const phase = useRef(0)
  const progress = useRef(0)

  const parts = useMemo<PartSpec[]>(
    () => buildParts(String(config.accentColor ?? '#7c6cff'), preview),
    [config.accentColor, preview],
  )

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return

    const speed = Math.max(0.1, Number(config.animationSpeed))
    const auto = config.autoExplode !== false
    if (auto) {
      phase.current += delta * speed * 0.9
      progress.current = (Math.sin(phase.current) + 1) / 2
    } else {
      progress.current = THREE.MathUtils.damp(
        progress.current,
        config.explode ? 1 : 0,
        3 * speed,
        delta,
      )
    }

    g.rotation.y += delta * Number(config.rotationSpeed)

    const distance = Number(config.explodeDistance)
    const spacing = Number(config.partSpacing) * 0.18
    const off = distance * progress.current + spacing
    const highlight = new THREE.Color(config.highlightColor ?? '#ffb454')

    for (let i = 0; i < parts.length; i++) {
      const m = refs.current[i]
      if (!m) continue
      const p = parts[i]
      m.position.set(
        p.base[0] + p.dir[0] * off,
        p.base[1] + p.dir[1] * off,
        p.base[2] + p.dir[2] * off,
      )
      const mat = m.material as THREE.MeshStandardMaterial
      const hov = hovered.current[i] === true
      mat.emissive.set(hov ? highlight : p.color)
      mat.emissiveIntensity = THREE.MathUtils.damp(
        mat.emissiveIntensity,
        hov ? 1.2 : p.baseEmissive,
        10,
        delta,
      )
    }
  })

  return (
    <group ref={group} position={[0, -0.15, 0]}>
      {parts.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          position={p.base}
          rotation={p.rotation}
          castShadow={!preview}
          receiveShadow={!preview}
          onPointerOver={(e) => {
            e.stopPropagation()
            hovered.current[i] = true
          }}
          onPointerOut={() => {
            hovered.current[i] = false
          }}
        >
          <PartGeometry spec={p} />
          <meshStandardMaterial
            color={p.color}
            roughness={p.roughness}
            metalness={p.metalness}
            emissive={p.color}
            emissiveIntensity={p.baseEmissive}
          />
        </mesh>
      ))}
    </group>
  )
}

function Scene({ config, preview = false }: { config: Record<string, any>; preview?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 7, 5]} intensity={1.3} castShadow={!preview} />
      <pointLight position={[-4, -2, -3]} intensity={0.7} color={config.accentColor ?? '#7c6cff'} />
      <Device config={config} preview={preview} />
      <ContactShadows
        position={[0, -1.7, 0]}
        opacity={0.5}
        scale={8}
        blur={2.4}
        far={3}
        color="#000000"
        frames={preview ? 1 : undefined}
      />
    </>
  )
}

function Stage(props: ExperimentComponentProps & { preview?: boolean }) {
  const { config, preview = false } = props
  const bg = '#0a0a16'
  return (
    <Canvas
      dpr={preview ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 0.4, 5.4], fov: 42 }}
      gl={{ antialias: !preview, alpha: false }}
      style={{ background: bg }}
      onCreated={({ gl }) => gl.setClearColor(new THREE.Color(bg))}
    >
      <Scene config={config} preview={preview} />
      <OrbitControls
        enablePan={false}
        enableZoom={!preview}
        enableRotate={!preview}
        minDistance={3}
        maxDistance={10}
      />
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
