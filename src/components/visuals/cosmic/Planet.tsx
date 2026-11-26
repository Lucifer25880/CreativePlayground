import { Suspense, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import {
  earthVertexShader,
  earthFragmentShader,
  texturedPlanetFragmentShader,
  ringVertexShader,
  ringFragmentShader,
} from './shaders'
import { SUN_DIR, type PlanetSpec } from './planets'

interface PlanetProps {
  spec: PlanetSpec
  position: [number, number, number]
  reduceRef: MutableRefObject<boolean>
}

export function Planet(props: PlanetProps) {
  return (
    <Suspense fallback={null}>
      {props.spec.type === 2 ? <EarthPlanet {...props} /> : <TexturedPlanet {...props} />}
    </Suspense>
  )
}

function spinFor(spec: PlanetSpec) {
  return 0.04 + spec.radius * 0.03
}

function TexturedPlanet({ spec, position, reduceRef }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const map = useLoader(THREE.TextureLoader, spec.texture)
  map.colorSpace = THREE.SRGBColorSpace

  const uniforms = useMemo(
    () => ({
      uMap: { value: map },
      uSunDir: { value: SUN_DIR.clone() },
      uAtmo: { value: new THREE.Color(spec.atmo) },
      uSpec: { value: 0.12 },
    }),
    [map, spec],
  )

  const spin = spinFor(spec)
  useFrame((_state, delta) => {
    if (reduceRef.current) return
    if (meshRef.current) meshRef.current.rotation.y += delta * spin
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[spec.radius, 64, 64]} />
        <shaderMaterial
          vertexShader={earthVertexShader}
          fragmentShader={texturedPlanetFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      {spec.ring && <Ring radius={spec.radius} color={spec.ring.color} texture={spec.ring.texture} />}
    </group>
  )
}

function EarthPlanet({ spec, position, reduceRef }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [dayMap, cloudsMap] = useLoader(THREE.TextureLoader, [spec.texture, '/textures/earth_clouds.png'])
  dayMap.colorSpace = THREE.SRGBColorSpace
  cloudsMap.colorSpace = THREE.NoColorSpace

  const uniforms = useMemo(
    () => ({
      uDay: { value: dayMap },
      uClouds: { value: cloudsMap },
      uSunDir: { value: SUN_DIR.clone() },
      uAtmo: { value: new THREE.Color(spec.atmo) },
    }),
    [dayMap, cloudsMap, spec],
  )

  const spin = spinFor(spec)
  useFrame((_state, delta) => {
    if (reduceRef.current) return
    if (meshRef.current) meshRef.current.rotation.y += delta * spin
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[spec.radius, 96, 96]} />
        <shaderMaterial
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </group>
  )
}

function Ring({ radius, color, texture }: { radius: number; color: string; texture: string }) {
  const inner = radius * 1.45
  const outer = radius * 2.55
  const ringTex = useLoader(THREE.TextureLoader, texture)
  ringTex.colorSpace = THREE.SRGBColorSpace

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uRing: { value: ringTex },
      uInner: { value: inner },
      uOuter: { value: outer },
    }),
    [ringTex, radius, color],
  )

  return (
    <mesh rotation={[-Math.PI / 2 + 0.16, 0, 0]} renderOrder={2}>
      <ringGeometry args={[inner, outer, 160]} />
      <shaderMaterial
        vertexShader={ringVertexShader}
        fragmentShader={ringFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
