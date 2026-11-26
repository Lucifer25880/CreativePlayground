import { useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Planet } from './Planet'
import { PLANETS } from './planets'
import { useCosmicStore, type ExplosionState } from '@/stores/cosmicStore'

const TAU = Math.PI * 2
const BELT_RADIUS = 8.6
const EXPLODE_DURATION = 1.9
const REWIND_DURATION = 2.6
const MAX_OFFSET = 26

export function Belt({
  scrollRef,
  reduceRef,
  explosionRef,
  beltRef,
}: {
  scrollRef: MutableRefObject<number>
  reduceRef: MutableRefObject<boolean>
  explosionRef: MutableRefObject<ExplosionState>
  beltRef: MutableRefObject<THREE.Group | null>
}) {
  const group = useRef<THREE.Group | null>(null)
  const wrappers = useRef<(THREE.Group | null)[]>([])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const store = useCosmicStore.getState()
    const ref = explosionRef.current

    // Drive the explode/rewind progress and hand phase transitions back to the store.
    if (store.phase === 'exploding') {
      ref.progress = Math.min(1, ref.progress + delta / EXPLODE_DURATION)
      if (ref.progress >= 1) store.setPhase('exploded')
    } else if (store.phase === 'rewinding') {
      ref.progress = Math.max(0, ref.progress - delta / REWIND_DURATION)
      if (ref.progress <= 0) store.setPhase('idle')
    } else if (store.phase === 'exploded') {
      ref.progress = 1
    } else {
      ref.progress = 0
    }

    // The belt only spins while idle; freeze it during explode / rewind.
    if (store.phase === 'idle') {
      const drift = reduceRef.current ? 0 : state.clock.elapsedTime * 0.018
      const target = scrollRef.current * TAU * 1.4 + drift
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, target, 2.2, delta)
    }

    const p = ref.progress
    const eased = p * p
    const n = PLANETS.length
    for (let i = 0; i < n; i++) {
      const el = wrappers.current[i]
      if (!el) continue
      const angle = Math.PI / 2 + (i / n) * TAU
      const dx = Math.cos(angle)
      const dz = Math.sin(angle)

      let offset = 0
      let scale = 1

      if (store.phase === 'exploding' || store.phase === 'exploded') {
        offset = eased * MAX_OFFSET
        if (p < 0.3) scale = 1 + (p / 0.3) * 0.5
        else if (p < 0.7) scale = 1.5 * (1 - (p - 0.3) / 0.4)
        else scale = 0
        if (store.phase === 'exploded') scale = 0
      } else if (store.phase === 'rewinding') {
        offset = eased * MAX_OFFSET
        scale = 1 - p
      }

      el.position.set(dx * offset, 0, dz * offset)
      el.scale.setScalar(Math.max(0, scale))
    }
  })

  return (
    <group
      ref={(el) => {
        group.current = el
        beltRef.current = el
      }}
    >
      {PLANETS.map((spec, i) => {
        const angle = Math.PI / 2 + (i / PLANETS.length) * TAU
        return (
          <group
            key={spec.name}
            ref={(el) => {
              wrappers.current[i] = el
            }}
          >
            <Planet
              spec={spec}
              position={[Math.cos(angle) * BELT_RADIUS, 0, Math.sin(angle) * BELT_RADIUS]}
              reduceRef={reduceRef}
            />
          </group>
        )
      })}
    </group>
  )
}
