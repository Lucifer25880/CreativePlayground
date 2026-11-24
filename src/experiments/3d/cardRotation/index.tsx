import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, ContactShadows, Float } from '@react-three/drei'
import * as THREE from 'three'
import type { ExperimentModule, ExperimentComponentProps } from '../../shared/types'
import { definition } from './meta'

const DEG = Math.PI / 180

interface SceneProps {
  config: Record<string, any>
  preview?: boolean
}

function Card({ config, preview }: SceneProps) {
  const group = useRef<THREE.Group>(null)
  const hovered = useRef(false)

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const pointer = state.pointer
    const follow = config.mouseFollow ? 1 : 0
    const baseX = Number(config.rotationX) * DEG
    const baseY = Number(config.rotationY) * DEG
    const targetX = baseX + pointer.y * 20 * DEG * follow
    const targetY =
      baseY + pointer.x * 26 * DEG * follow + state.clock.elapsedTime * Number(config.rotationSpeed)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 6, delta)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 6, delta)
    // hover scale
    const targetScale = Number(config.scale) * (hovered.current ? Number(config.hoverScale) : 1)
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetScale, 8, delta))
  })

  const accent = new THREE.Color(config.accentColor ?? '#7c6cff')
  const wireframe = !!config.wireframe

  return (
    <group
      ref={group}
      onPointerOver={() => (hovered.current = true)}
      onPointerOut={() => (hovered.current = false)}
    >
      <RoundedBox
        args={[1.5, 2.1, 0.12]}
        radius={0.09}
        smoothness={6}
        castShadow={!!config.shadowEnabled}
        receiveShadow={!!config.shadowEnabled}
      >
        <meshStandardMaterial
          color={accent}
          metalness={Number(config.metalness)}
          roughness={Number(config.roughness)}
          emissive={accent}
          emissiveIntensity={Number(config.glowIntensity)}
        />
      </RoundedBox>
      {wireframe && (
        <RoundedBox args={[1.52, 2.12, 0.13]} radius={0.09} smoothness={4}>
          <meshBasicMaterial color={accent} wireframe transparent opacity={0.35} />
        </RoundedBox>
      )}
    </group>
  )
}

function Scene({ config, preview }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.35 * Number(config.lightIntensity)} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={Number(config.lightIntensity)}
        castShadow={!!config.shadowEnabled && !preview}
      />
      <pointLight
        position={[-4, -2, -3]}
        intensity={Number(config.lightIntensity) * 0.6}
        color={config.accentColor ?? '#7c6cff'}
      />
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8} enabled={!preview}>
        <Card config={config} preview={preview} />
      </Float>
      <ContactShadows
        position={[0, -1.6, 0]}
        opacity={0.5}
        scale={7}
        blur={2.4}
        far={3}
        color="#000000"
        frames={preview ? 1 : undefined}
      />
    </>
  )
}

function Stage({ config, preview }: ExperimentComponentProps & { preview?: boolean }) {
  const bg = config.backgroundColor ?? '#0b0b18'
  return (
    <Canvas
      dpr={preview ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 0, 4.2], fov: 38 }}
      gl={{ antialias: !preview, alpha: false }}
      style={{ background: bg }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(bg))
      }}
    >
      <Scene config={config} preview={preview} />
    </Canvas>
  )
}

export const Preview: ExperimentModule['Preview'] = (props) => <Stage {...props} preview />;
export const Renderer: ExperimentModule['Renderer'] = (props) => <Stage {...props} preview={false} />

const module: ExperimentModule = { Preview, Renderer }
export default module
export { definition }
