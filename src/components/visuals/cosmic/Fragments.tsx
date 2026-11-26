import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCosmicStore, type ExplosionState } from '@/stores/cosmicStore'
import { PLANETS } from './planets'

const COUNT = 150
const BELT_RADIUS = 8.6
const TAU = Math.PI * 2

/** 150 large tumbling planet shards that burst outward on explode. */
export function Fragments({
  explosionRef,
  beltRef,
}: {
  explosionRef: MutableRefObject<ExplosionState>
  beltRef: MutableRefObject<THREE.Group | null>
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const phase = useCosmicStore((s) => s.phase)

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), [])
  const material = useMemo(() => new THREE.MeshBasicMaterial(), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])

  const stateRef = useRef({
    active: false,
    pos: new Float32Array(COUNT * 3),
    vel: new Float32Array(COUNT * 3),
    rot: new Float32Array(COUNT * 3),
    rotVel: new Float32Array(COUNT * 3),
    base: new Float32Array(COUNT),
    life: new Float32Array(COUNT),
    maxLife: new Float32Array(COUNT),
  })

  // initialise instance colours + hide everything
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < COUNT; i++) {
      const spec = PLANETS[Math.floor(Math.random() * PLANETS.length)]
      color.set(spec.a)
      mesh.setColorAt(i, color)
      dummy.position.set(0, 0, 0)
      dummy.scale.setScalar(0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.instanceMatrix.needsUpdate = true
  }, [dummy, color])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useEffect(() => {
    if (phase === 'exploding') {
      const st = stateRef.current
      const rot = beltRef.current?.rotation.y ?? 0
      for (let i = 0; i < COUNT; i++) {
        const pi = Math.floor(Math.random() * PLANETS.length)
        const angle = rot + Math.PI / 2 + (pi / PLANETS.length) * TAU
        const ox = Math.cos(angle) * BELT_RADIUS
        const oz = Math.sin(angle) * BELT_RADIUS
        const jitter = () => (Math.random() - 0.5) * 1.6
        st.pos[i * 3] = ox + jitter()
        st.pos[i * 3 + 1] = jitter()
        st.pos[i * 3 + 2] = oz + jitter()

        const len = Math.hypot(ox, oz) || 1
        const outX = ox / len
        const outZ = oz / len
        const speed = 3 + Math.random() * 9
        st.vel[i * 3] = outX * speed + (Math.random() - 0.5) * 3
        st.vel[i * 3 + 1] = (Math.random() - 0.3) * speed
        st.vel[i * 3 + 2] = outZ * speed + (Math.random() - 0.5) * 3

        st.rot[i * 3] = Math.random() * TAU
        st.rot[i * 3 + 1] = Math.random() * TAU
        st.rot[i * 3 + 2] = Math.random() * TAU
        st.rotVel[i * 3] = (Math.random() - 0.5) * 7
        st.rotVel[i * 3 + 1] = (Math.random() - 0.5) * 7
        st.rotVel[i * 3 + 2] = (Math.random() - 0.5) * 7

        st.base[i] = 0.16 + Math.random() * 0.5
        st.maxLife[i] = 1.8 + Math.random() * 1.3
        st.life[i] = st.maxLife[i]
      }
      st.active = true
    } else if (phase === 'idle') {
      stateRef.current.active = false
    }
  }, [phase, beltRef])

  useFrame((_s, dt) => {
    const st = stateRef.current
    const mesh = meshRef.current
    if (!st.active || !mesh) return
    const d = Math.min(0.05, dt)
    for (let i = 0; i < COUNT; i++) {
      if (st.life[i] <= 0) {
        dummy.position.set(0, 0, 0)
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
        continue
      }
      st.life[i] -= d
      st.pos[i * 3] += st.vel[i * 3] * d
      st.pos[i * 3 + 1] += st.vel[i * 3 + 1] * d
      st.pos[i * 3 + 2] += st.vel[i * 3 + 2] * d
      st.vel[i * 3] *= 0.99
      st.vel[i * 3 + 1] *= 0.99
      st.vel[i * 3 + 2] *= 0.99
      st.rot[i * 3] += st.rotVel[i * 3] * d
      st.rot[i * 3 + 1] += st.rotVel[i * 3 + 1] * d
      st.rot[i * 3 + 2] += st.rotVel[i * 3 + 2] * d

      const t = Math.max(0, st.life[i] / st.maxLife[i])
      const s = st.base[i] * Math.min(1, t * 5)
      dummy.position.set(st.pos[i * 3], st.pos[i * 3 + 1], st.pos[i * 3 + 2])
      dummy.rotation.set(st.rot[i * 3], st.rot[i * 3 + 1], st.rot[i * 3 + 2])
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} frustumCulled={false} />
}
