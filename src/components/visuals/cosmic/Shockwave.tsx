import { useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCosmicStore, type ExplosionState } from '@/stores/cosmicStore'

/** Expanding shockwave ring + a bright core flash at the belt centre. */
export function Shockwave({ explosionRef }: { explosionRef: MutableRefObject<ExplosionState> }) {
  const ringRef = useRef<THREE.Mesh>(null)
  const ringMat = useRef<THREE.MeshBasicMaterial>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const coreMat = useRef<THREE.MeshBasicMaterial>(null)
  const phase = useCosmicStore((s) => s.phase)

  useFrame(() => {
    const p = explosionRef.current.progress

    if (ringRef.current && ringMat.current) {
      if (phase === 'exploding') {
        const s = 0.4 + p * 30
        ringRef.current.scale.set(s, s, s)
        ringMat.current.opacity = Math.max(0, 0.9 * (1 - p))
      } else if (phase === 'rewinding') {
        const s = 0.4 + p * 30
        ringRef.current.scale.set(s, s, s)
        ringMat.current.opacity = Math.max(0, 0.5 * p)
      } else {
        ringMat.current.opacity = 0
      }
    }

    if (coreRef.current && coreMat.current) {
      if (phase === 'exploding') {
        const f = Math.max(0, 1 - p * 3)
        coreRef.current.scale.setScalar(0.6 + p * 4)
        coreMat.current.opacity = f * f
      } else {
        coreMat.current.opacity = 0
      }
    }
  })

  return (
    <>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 1, 96]} />
        <meshBasicMaterial
          ref={ringMat}
          color="#ffd9a0"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          ref={coreMat}
          color="#fff2d6"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}
