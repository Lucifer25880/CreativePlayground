import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import type { ExperimentModule, ExperimentComponentProps } from '@/experiments/shared/types'
import { definition } from './meta'

interface SceneProps {
  config: Record<string, any>
  preview?: boolean
}

function GeometryNode({ type }: { type: string }) {
  switch (type) {
    case 'icosahedron':
      return <icosahedronGeometry args={[1.4, 0]} />
    case 'octahedron':
      return <octahedronGeometry args={[1.4, 0]} />
    case 'dodecahedron':
      return <dodecahedronGeometry args={[1.4, 0]} />
    case 'torusKnot':
      return <torusKnotGeometry args={[0.95, 0.3, 160, 20]} />
    case 'box':
      return <boxGeometry args={[1.7, 1.7, 1.7]} />
    case 'sphere':
      return <sphereGeometry args={[1.4, 48, 48]} />
    case 'cone':
      return <coneGeometry args={[1.35, 2.3, 48]} />
    case 'torus':
      return <torusGeometry args={[1.1, 0.45, 24, 64]} />
    default:
      return <icosahedronGeometry args={[1.4, 0]} />
  }
}

function Polyhedron({ config, preview }: SceneProps) {
  const group = useRef<THREE.Group>(null)
  const hovered = useRef(false)

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const speed = Number(config.rotationSpeed) * (preview ? 0.5 : 1)
    g.rotation.y += speed * delta
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, state.pointer.y * 0.6, 4, delta)
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, -state.pointer.x * 0.3, 4, delta)
    const target = hovered.current ? 1.14 : 1
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, target, 8, delta))
  })

  const accent = config.accentColor ?? '#38e1ff'
  const wireframe = !!config.wireframe

  return (
    <group
      ref={group}
      onPointerOver={() => (hovered.current = true)}
      onPointerOut={() => (hovered.current = false)}
    >
      <mesh castShadow={!preview} receiveShadow={!preview}>
        <GeometryNode type={config.geometryType ?? 'icosahedron'} />
        <meshStandardMaterial
          color={accent}
          metalness={Number(config.metalness)}
          roughness={Number(config.roughness)}
          flatShading={!!config.flatShading}
          emissive={accent}
          emissiveIntensity={0.15}
        />
      </mesh>
      {wireframe && (
        <mesh scale={1.015}>
          <GeometryNode type={config.geometryType ?? 'icosahedron'} />
          <meshBasicMaterial color={accent} wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  )
}

function OrbitLight({ intensity, color, preview }: { intensity: number; color: string; preview?: boolean }) {
  const ref = useRef<THREE.PointLight>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime * (preview ? 0.4 : 0.7)
    const r = 3.4
    ref.current?.position.set(Math.cos(t) * r, 1.6 + Math.sin(t * 1.3) * 1.2, Math.sin(t) * r)
  })
  return <pointLight ref={ref} intensity={intensity} color={color} />
}

function Scene({ config, preview }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 4]} intensity={0.5} />
      <OrbitLight
        intensity={Number(config.lightIntensity)}
        color={config.accentColor ?? '#38e1ff'}
        preview={preview}
      />
      <Polyhedron config={config} preview={preview} />
      {!preview && (
        <ContactShadows position={[0, -1.9, 0]} opacity={0.45} scale={8} blur={2.6} far={3.4} color="#000000" />
      )}
    </>
  )
}

function Stage({ config, preview }: ExperimentComponentProps) {
  return (
    <Canvas
      dpr={preview ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 0, 4.5], fov: 42 }}
      gl={{ antialias: !preview, alpha: false }}
      style={{ background: '#0b0b18' }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#0b0b18'))
      }}
    >
      <Scene config={config} preview={preview} />
    </Canvas>
  )
}

export const Preview: ExperimentModule['Preview'] = (props) => <Stage {...props} preview />
export const Renderer: ExperimentModule['Renderer'] = (props) => <Stage {...props} preview={false} />

const module: ExperimentModule = { Preview, Renderer }
export default module
export { definition }
