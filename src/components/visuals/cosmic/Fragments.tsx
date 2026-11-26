import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { useCosmicStore, type ExplosionState } from '@/stores/cosmicStore'
import { PLANETS } from './planets'

const PER_PLANET = 32
const BELT_RADIUS = 8.6
const TAU = Math.PI * 2

// One rock surface normal map + each planet's own surface texture.
const LOAD_URLS = [...PLANETS.map((p) => p.texture), '/textures/rock_normal.jpg']

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

interface FragState {
  active: boolean
  fade: number
  pos: Float32Array
  vel: Float32Array
  rot: Float32Array
  rotVel: Float32Array
  scale: Float32Array
}

/**
 * Planet shards. Each planet gets its OWN instanced mesh whose material uses
 * that planet's surface texture — so the chunks visibly belong to that planet
 * (Earth blue/green, Mars red, Jupiter bands, Saturn gold, ...).
 */
export function Fragments({
  explosionRef,
  beltRef,
}: {
  explosionRef: MutableRefObject<ExplosionState>
  beltRef: MutableRefObject<THREE.Group | null>
}) {
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([])
  const phase = useCosmicStore((s) => s.phase)

  const textures = useLoader(THREE.TextureLoader, LOAD_URLS)
  const planetTextures = textures.slice(0, PLANETS.length) as THREE.Texture[]
  const rockNormal = textures[PLANETS.length] as THREE.Texture
  rockNormal.colorSpace = THREE.NoColorSpace
  planetTextures.forEach((t) => {
    t.colorSpace = THREE.SRGBColorSpace
  })

  const materials = useMemo(
    () =>
      planetTextures.map(
        (tex) =>
          new THREE.MeshStandardMaterial({
            map: tex,
            normalMap: rockNormal,
            roughness: 0.9,
            metalness: 0.05,
            flatShading: true,
            side: THREE.DoubleSide,
          }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [textures],
  )

  const geometry = useMemo(() => makeRockGeometry(3.7), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const stateRef = useRef<FragState>({
    active: false,
    fade: 0,
    pos: new Float32Array(PLANETS.length * PER_PLANET * 3),
    vel: new Float32Array(PLANETS.length * PER_PLANET * 3),
    rot: new Float32Array(PLANETS.length * PER_PLANET * 3),
    rotVel: new Float32Array(PLANETS.length * PER_PLANET * 3),
    scale: new Float32Array(PLANETS.length * PER_PLANET * 3),
  })

  useEffect(() => {
    return () => {
      geometry.dispose()
      materials.forEach((m) => m.dispose())
    }
  }, [geometry, materials])

  // Hide all instances on mount.
  useEffect(() => {
    for (let pi = 0; pi < PLANETS.length; pi++) {
      const mesh = meshes.current[pi]
      if (!mesh) continue
      for (let k = 0; k < PER_PLANET; k++) {
        dummy.position.set(0, 0, 0)
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        mesh.setMatrixAt(k, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
  }, [dummy])

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
          const theta = Math.random() * TAU
          const phi = Math.acos(2 * Math.random() - 1)
          const nx = Math.sin(phi) * Math.cos(theta)
          const ny = Math.cos(phi)
          const nz = Math.sin(phi) * Math.sin(theta)
          const rr = spec.radius * (0.65 + Math.random() * 0.45)
          st.pos[i * 3] = cx + nx * rr
          st.pos[i * 3 + 1] = ny * rr
          st.pos[i * 3 + 2] = cz + nz * rr

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

    // Shards fly out during the explosion, then dissipate once it finishes.
    if (st.active && (phase === 'exploded' || phase === 'rewinding')) {
      st.fade = Math.max(0, st.fade - dt / 1.2)
      if (st.fade <= 0) st.active = false
    }
    if (!st.active && st.fade <= 0) return

    const d = Math.min(0.05, dt)
    for (let pi = 0; pi < PLANETS.length; pi++) {
      const mesh = meshes.current[pi]
      if (!mesh) continue
      for (let k = 0; k < PER_PLANET; k++) {
        const i = pi * PER_PLANET + k
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
        mesh.setMatrixAt(k, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      {PLANETS.map((spec, pi) => (
        <instancedMesh
          key={spec.name}
          ref={(el) => {
            meshes.current[pi] = el
          }}
          args={[geometry, materials[pi], PER_PLANET]}
          frustumCulled={false}
        />
      ))}
    </>
  )
}
