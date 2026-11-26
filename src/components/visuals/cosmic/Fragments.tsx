import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { useCosmicStore, type ExplosionState } from '@/stores/cosmicStore'
import { PLANETS } from './planets'

const PER_PLANET = 32
const TOTAL = PLANETS.length * PER_PLANET
const BELT_RADIUS = 8.6
const TAU = Math.PI * 2

/** Deterministic 0..1 hash so duplicated (shared) vertices displace identically. */
function hash3(x: number, y: number, z: number, seed: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 17.3) * 43758.5453
  return s - Math.floor(s)
}

/** Turn a regular polyhedron into a jagged, natural-looking rock. */
function makeRockGeometry(seed: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, 1)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const vx = v.x
    const vy = v.y
    const vz = v.z
    const h1 = hash3(vx, vy, vz, seed)
    const h2 = hash3(vy, vz, vx, seed + 11.1)
    const h3 = hash3(vz, vx, vy, seed + 23.3)
    const radial = 0.72 + h1 * 0.55
    v.set(
      vx * radial + (h2 - 0.5) * 0.34,
      vy * radial + (h3 - 0.5) * 0.34,
      vz * radial + (h1 - 0.5) * 0.34,
    )
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

/**
 * Large, lit, tumbling planet shards.
 * - Spawn on each planet's shell so the planet visibly breaks apart into chunks.
 * - Keep drifting in space after the explosion (they persist).
 * - Fade away only while the belt rewinds.
 */
export function Fragments({
  explosionRef,
  beltRef,
}: {
  explosionRef: MutableRefObject<ExplosionState>
  beltRef: MutableRefObject<THREE.Group | null>
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const phase = useCosmicStore((s) => s.phase)

  const [colorMap, normalMap] = useLoader(THREE.TextureLoader, [
    '/textures/rock_color.jpg',
    '/textures/rock_normal.jpg',
  ])
  colorMap.colorSpace = THREE.SRGBColorSpace
  normalMap.colorSpace = THREE.NoColorSpace
  for (const tex of [colorMap, normalMap]) {
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(2, 2)
  }

  const geometry = useMemo(() => makeRockGeometry(3.7), [])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: colorMap,
        normalMap,
        roughness: 0.9,
        metalness: 0.06,
        flatShading: true,
        side: THREE.DoubleSide,
      }),
    [colorMap, normalMap],
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])

  const stateRef = useRef({
    active: false,
    fade: 0,
    pos: new Float32Array(TOTAL * 3),
    vel: new Float32Array(TOTAL * 3),
    rot: new Float32Array(TOTAL * 3),
    rotVel: new Float32Array(TOTAL * 3),
    scale: new Float32Array(TOTAL * 3),
  })

  // Initialise instance colours + hide everything.
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < TOTAL; i++) {
      const spec = PLANETS[Math.floor(i / PER_PLANET)]
      const specColor = new THREE.Color(Math.random() < 0.55 ? spec.a : spec.b)
      color.setRGB(
        0.55 + specColor.r * 0.45,
        0.55 + specColor.g * 0.45,
        0.55 + specColor.b * 0.45,
      )
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
      for (let pi = 0; pi < PLANETS.length; pi++) {
        const spec = PLANETS[pi]
        const angle = rot + Math.PI / 2 + (pi / PLANETS.length) * TAU
        const cx = Math.cos(angle) * BELT_RADIUS
        const cz = Math.sin(angle) * BELT_RADIUS

        for (let k = 0; k < PER_PLANET; k++) {
          const i = pi * PER_PLANET + k
          // spawn on the planet's shell
          const theta = Math.random() * TAU
          const phi = Math.acos(2 * Math.random() - 1)
          const nx = Math.sin(phi) * Math.cos(theta)
          const ny = Math.cos(phi)
          const nz = Math.sin(phi) * Math.sin(theta)
          const rr = spec.radius * (0.65 + Math.random() * 0.45)
          st.pos[i * 3] = cx + nx * rr
          st.pos[i * 3 + 1] = ny * rr
          st.pos[i * 3 + 2] = cz + nz * rr

          // burst outward from the planet centre
          const speed = 1.4 + Math.random() * 3.4
          st.vel[i * 3] = (nx * 0.8 + (Math.random() - 0.5) * 0.5) * speed
          st.vel[i * 3 + 1] = (ny * 0.8 + (Math.random() - 0.5) * 0.5) * speed
          st.vel[i * 3 + 2] = (nz * 0.8 + (Math.random() - 0.5) * 0.5) * speed

          st.rot[i * 3] = Math.random() * TAU
          st.rot[i * 3 + 1] = Math.random() * TAU
          st.rot[i * 3 + 2] = Math.random() * TAU
          st.rotVel[i * 3] = (Math.random() - 0.5) * 4
          st.rotVel[i * 3 + 1] = (Math.random() - 0.5) * 4
          st.rotVel[i * 3 + 2] = (Math.random() - 0.5) * 4

          const base = spec.radius * (0.14 + Math.random() * 0.28)
          st.scale[i * 3] = base * (0.6 + Math.random() * 0.9)
          st.scale[i * 3 + 1] = base * (0.6 + Math.random() * 0.9)
          st.scale[i * 3 + 2] = base * (0.6 + Math.random() * 0.9)
        }
      }
      st.active = true
      st.fade = 1
    } else if (phase === 'idle') {
      stateRef.current.active = false
      stateRef.current.fade = 0
    }
  }, [phase, beltRef])

  useFrame((_s, dt) => {
    const st = stateRef.current
    const mesh = meshRef.current
    if (!mesh) return

    // Shards fly out during the explosion, then dissipate once it finishes.
    if (st.active && (phase === 'exploded' || phase === 'rewinding')) {
      st.fade = Math.max(0, st.fade - dt / 1.2)
      if (st.fade <= 0) st.active = false
    }
    if (!st.active && st.fade <= 0) return

    const d = Math.min(0.05, dt)
    for (let i = 0; i < TOTAL; i++) {
      if (st.active) {
        st.pos[i * 3] += st.vel[i * 3] * d
        st.pos[i * 3 + 1] += st.vel[i * 3 + 1] * d
        st.pos[i * 3 + 2] += st.vel[i * 3 + 2] * d
        st.vel[i * 3] *= 0.985
        st.vel[i * 3 + 1] *= 0.985
        st.vel[i * 3 + 2] *= 0.985
        st.rot[i * 3] += st.rotVel[i * 3] * d
        st.rot[i * 3 + 1] += st.rotVel[i * 3 + 1] * d
        st.rot[i * 3 + 2] += st.rotVel[i * 3 + 2] * d
      }
      const f = st.active ? st.fade : 0
      dummy.position.set(st.pos[i * 3], st.pos[i * 3 + 1], st.pos[i * 3 + 2])
      dummy.rotation.set(st.rot[i * 3], st.rot[i * 3 + 1], st.rot[i * 3 + 2])
      dummy.scale.set(st.scale[i * 3] * f, st.scale[i * 3 + 1] * f, st.scale[i * 3 + 2] * f)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, TOTAL]} frustumCulled={false} />
}
