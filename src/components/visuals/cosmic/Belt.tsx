import { useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Planet } from './Planet'
import { PLANETS } from './planets'
import { useCosmicStore, type ExplosionState } from '@/stores/cosmicStore'

const TAU = Math.PI * 2
const BELT_RADIUS = 8.6
const EXPLODE_DURATION = 1.9

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

    if (store.phase === 'exploding') {
      ref.progress = Math.min(1, ref.progress + delta / EXPLODE_DURATION)
      if (ref.progress >= 1) store.setPhase('exploded')
    } else if (store.phase === 'exploded' || store.phase === 'rewinding') {
      ref.progress = 1
    } else {
      ref.progress = 0
    }

    // The belt only spins while idle; freeze it during explode / glitch-restore.
    if (store.phase === 'idle') {
      const drift = reduceRef.current ? 0 : state.clock.elapsedTime * 0.018
      const target = scrollRef.current * TAU * 1.4 + drift
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, target, 2.2, delta)
    }

    const p = ref.progress
    const n = PLANETS.length
    for (let i = 0; i < n; i++) {
      const el = wrappers.current[i]
      if (!el) continue
      const angle = Math.PI / 2 + (i / n) * TAU
      const dx = Math.cos(angle)
      const dz = Math.sin(angle)

      let scale = 1
      if (store.phase === 'exploding') {
        // Shatter in place: the planet vanishes almost instantly.
        scale = Math.max(0, 1 - p / 0.08)
      } else if (store.phase === 'exploded' || store.phase === 'rewinding') {
        scale = 0
      }

      // Compensate the wrapper scale so the planet stays at its orbit radius.
      const dist = (1 - Math.max(0, scale)) * BELT_RADIUS
      el.position.set(dx * dist, 0, dz * dist)
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
