import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCosmicStore, type ExplosionState } from '@/stores/cosmicStore'
import { shockwaveVertexShader, shockwaveFragmentShader } from './shaders'

/**
 * A single soft shockwave ring (bright leading edge, fading trail) expanding
 * across the belt plane, plus a bright core flash.
 */
export function Shockwave({ explosionRef }: { explosionRef: MutableRefObject<ExplosionState> }) {
  const coreRef = useRef<THREE.Mesh>(null)
  const coreMat = useRef<THREE.MeshBasicMaterial>(null)
  const phase = useCosmicStore((s) => s.phase)

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uColor: { value: new THREE.Color('#ff9a4a') },
      uOpacity: { value: 0 },
    }),
    [],
  )

  useFrame(() => {
    const p = explosionRef.current.progress

    if (phase === 'exploding') {
      uniforms.uProgress.value = p
      uniforms.uOpacity.value = 1
    } else if (phase === 'rewinding') {
      uniforms.uProgress.value = p
      uniforms.uOpacity.value = 0.45
    } else {
      uniforms.uOpacity.value = 0
    }

    if (coreRef.current && coreMat.current) {
      if (phase === 'exploding') {
        const f = Math.max(0, 1 - p * 2.6)
        coreRef.current.scale.setScalar(0.6 + p * 5.5)
        coreMat.current.opacity = f * f
      } else {
        coreMat.current.opacity = 0
      }
    }
  })

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[40, 40]} />
        <shaderMaterial
          vertexShader={shockwaveVertexShader}
          fragmentShader={shockwaveFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          ref={coreMat}
          color="#ff8a3a"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}
