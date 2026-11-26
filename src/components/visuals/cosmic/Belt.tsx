import { useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Planet } from './Planet'
import { PLANETS } from './planets'

const TAU = Math.PI * 2
const BELT_RADIUS = 8.6

export function Belt({
  scrollRef,
  reduceRef,
}: {
  scrollRef: MutableRefObject<number>
  reduceRef: MutableRefObject<boolean>
}) {
  const group = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!group.current) return
    const drift = reduceRef.current ? 0 : state.clock.elapsedTime * 0.018
    const target = scrollRef.current * TAU * 1.4 + drift
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, target, 2.2, delta)
  })

  return (
    <group ref={group}>
      {PLANETS.map((spec, i) => {
        const angle = Math.PI / 2 + (i / PLANETS.length) * TAU
        return (
          <Planet
            key={spec.name}
            spec={spec}
            position={[Math.cos(angle) * BELT_RADIUS, 0, Math.sin(angle) * BELT_RADIUS]}
            reduceRef={reduceRef}
          />
        )
      })}
    </group>
  )
}
