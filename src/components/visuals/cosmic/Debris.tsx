import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCosmicStore, type ExplosionState } from '@/stores/cosmicStore'
import { PLANETS } from './planets'

const COUNT = 800
const BELT_RADIUS = 8.6
const TAU = Math.PI * 2

/** 800 additive debris particles that burst outward from every planet on explode. */
export function Debris({
  explosionRef,
  beltRef,
}: {
  explosionRef: MutableRefObject<ExplosionState>
  beltRef: MutableRefObject<THREE.Group | null>
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const phase = useCosmicStore((s) => s.phase)

  const stateRef = useRef({
    active: false,
    pos: new Float32Array(COUNT * 3),
    vel: new Float32Array(COUNT * 3),
    life: new Float32Array(COUNT),
    maxLife: new Float32Array(COUNT),
    base: new Float32Array(COUNT * 3),
  })

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3))
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3))
    return g
  }, [])

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.17,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useEffect(() => {
    if (phase === 'exploding') {
      const st = stateRef.current
      const rot = beltRef.current?.rotation.y ?? 0
      const c = new THREE.Color()
      for (let i = 0; i < COUNT; i++) {
        const pi = Math.floor(Math.random() * PLANETS.length)
        const angle = rot + Math.PI / 2 + (pi / PLANETS.length) * TAU
        const ox = Math.cos(angle) * BELT_RADIUS
        const oz = Math.sin(angle) * BELT_RADIUS
        const jitter = () => (Math.random() - 0.5) * 1.7

        st.pos[i * 3] = ox + jitter()
        st.pos[i * 3 + 1] = jitter() * 0.8
        st.pos[i * 3 + 2] = oz + jitter()

        const len = Math.hypot(ox, oz) || 1
        const outX = ox / len
        const outZ = oz / len
        const speed = 2 + Math.random() * 9
        st.vel[i * 3] = outX * speed + (Math.random() - 0.5) * 3
        st.vel[i * 3 + 1] = (Math.random() - 0.35) * speed
        st.vel[i * 3 + 2] = outZ * speed + (Math.random() - 0.5) * 3

        st.maxLife[i] = 1.5 + Math.random() * 1.4
        st.life[i] = st.maxLife[i]

        const hue = Math.random() < 0.5 ? 0.07 + Math.random() * 0.07 : 0.52 + Math.random() * 0.2
        c.setHSL(hue, 0.9, 0.62)
        st.base[i * 3] = c.r
        st.base[i * 3 + 1] = c.g
        st.base[i * 3 + 2] = c.b
      }
      st.active = true
    } else if (phase === 'idle') {
      stateRef.current.active = false
    }
  }, [phase, beltRef])

  useFrame((_state, dt) => {
    const st = stateRef.current
    if (!st.active) return
    const geo = pointsRef.current?.geometry
    if (!geo) return
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
    const colAttr = geo.getAttribute('color') as THREE.BufferAttribute
    const pos = posAttr.array as Float32Array
    const col = colAttr.array as Float32Array

    let alive = false
    const d = Math.min(0.05, dt)
    for (let i = 0; i < COUNT; i++) {
      if (st.life[i] <= 0) {
        col[i * 3] = 0
        col[i * 3 + 1] = 0
        col[i * 3 + 2] = 0
        continue
      }
      alive = true
      st.life[i] -= d
      st.pos[i * 3] += st.vel[i * 3] * d
      st.pos[i * 3 + 1] += st.vel[i * 3 + 1] * d
      st.pos[i * 3 + 2] += st.vel[i * 3 + 2] * d
      st.vel[i * 3] *= 0.988
      st.vel[i * 3 + 1] *= 0.988
      st.vel[i * 3 + 2] *= 0.988

      const t = Math.max(0, Math.min(1, st.life[i] / st.maxLife[i]))
      const f = t * t
      pos[i * 3] = st.pos[i * 3]
      pos[i * 3 + 1] = st.pos[i * 3 + 1]
      pos[i * 3 + 2] = st.pos[i * 3 + 2]
      col[i * 3] = st.base[i * 3] * f
      col[i * 3 + 1] = st.base[i * 3 + 1] * f
      col[i * 3 + 2] = st.base[i * 3 + 2] * f
    }
    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    if (!alive) st.active = false
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}
