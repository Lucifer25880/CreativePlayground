import { useMemo } from 'react'
import * as THREE from 'three'
import { nebulaFragmentShader } from './shaders'
import { useBakeTexture } from './bake'

interface NebulaLayerSpec {
  pos: [number, number, number]
  scale: [number, number]
  color: string
  opacity: number
}

const LAYERS: NebulaLayerSpec[] = [
  { pos: [-7, 3, -30], scale: [28, 17], color: '#3b2a8c', opacity: 0.5 },
  { pos: [10, -4, -36], scale: [32, 19], color: '#0a4a7c', opacity: 0.42 },
  { pos: [1, 7, -42], scale: [36, 21], color: '#6a1a4c', opacity: 0.36 },
]

/**
 * Nebula — static FBM nebula baked ONCE into a texture, then drawn as additive
 * tinted planes. Visuals are unchanged (the pattern is the same), but the
 * per-frame full-plane noise cost is gone.
 */
export function Nebula() {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#ffffff') },
      uOpacity: { value: 1 },
      uTime: { value: 0 },
      uSeed: { value: 1.3 },
    }),
    [],
  )
  const texture = useBakeTexture(nebulaFragmentShader, uniforms, 512, 512)

  if (!texture) return null

  return (
    <>
      {LAYERS.map((layer, i) => (
        <mesh key={i} position={layer.pos}>
          <planeGeometry args={layer.scale} />
          <meshBasicMaterial
            map={texture}
            color={layer.color}
            transparent
            opacity={layer.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </>
  )
}
