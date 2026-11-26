import { useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCosmicStore, type ExplosionState } from '@/stores/cosmicStore'

/** Two expanding shockwave rings + a bright core flash at the belt centre. */
export function Shockwave({ explosionRef }: { explosionRef: MutableRefObject<ExplosionState> }) {
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring1Mat = useRef<THREE.MeshBasicMaterial>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const ring2Mat = useRef<THREE.MeshBasicMaterial>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const coreMat = useRef<THREE.MeshBasicMaterial>(null)
  const phase = useCosmicStore((s) => s.phase)

  useFrame(() => {
    const p = explosionRef.current.progress

    if (ring1Ref.current && ring1Mat.current) {
      if (phase === 'exploding') {
        const s = 0.4 + p * 34
        ring1Ref.current.scale.set(s, s, s)
        ring1Mat.current.opacity = Math.max(0, 0.95 * (1 - p))
      } else if (phase === 'rewinding') {
        const s = 0.4 + p * 34
        ring1Ref.current.scale.set(s, s, s)
        ring1Mat.current.opacity = Math.max(0, 0.5 * p)
      } else {
        ring1Mat.current.opacity = 0
      }
    }

    if (ring2Ref.current && ring2Mat.current) {
      if (phase === 'exploding') {
        const p2 = Math.max(0, (p - 0.18) / 0.82)
        const s = 0.4 + p2 * 26
        ring2Ref.current.scale.set(s, s, s)
        ring2Mat.current.opacity = Math.max(0, 0.65 * (1 - p2))
      } else if (phase === 'rewinding') {
        const s = 0.4 + p * 26
        ring2Ref.current.scale.set(s, s, s)
        ring2Mat.current.opacity = Math.max(0, 0.4 * p)
      } else {
        ring2Mat.current.opacity = 0
      }
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
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 1, 96]} />
        <meshBasicMaterial
          ref={ring1Mat}
          color="#ffd9a0"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2 + 0.15, 0.3, 0]}>
        <ringGeometry args={[0.85, 1, 96]} />
        <meshBasicMaterial
          ref={ring2Mat}
          color="#8fb4ff"
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
          color="#fff6e0"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}
