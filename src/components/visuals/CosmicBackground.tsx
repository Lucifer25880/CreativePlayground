import { useEffect, useRef, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useCosmicStore, type ExplosionState } from '@/stores/cosmicStore'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Starfield } from './cosmic/Starfield'
import { Nebula } from './cosmic/Nebula'
import { Belt } from './cosmic/Belt'
import { Debris } from './cosmic/Debris'
import { Fragments } from './cosmic/Fragments'
import { Shockwave } from './cosmic/Shockwave'

function CameraShake({ explosionRef }: { explosionRef: MutableRefObject<ExplosionState> }) {
  const { camera } = useThree()
  const phase = useCosmicStore((s) => s.phase)
  const base = useRef(new THREE.Vector3(0, 9, 18))

  useFrame(() => {
    if (phase === 'exploding') {
      const p = explosionRef.current.progress
      const amp = 0.5 * (1 - p)
      camera.position.set(
        base.current.x + (Math.random() - 0.5) * amp,
        base.current.y + (Math.random() - 0.5) * amp,
        base.current.z + (Math.random() - 0.5) * amp,
      )
    } else {
      camera.position.copy(base.current)
    }
    camera.lookAt(0, 0, 0)
  })

  return null
}

function Scene({
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
  const phase = useCosmicStore((s) => s.phase)
  const bloomIntensity = phase === 'exploding' ? 2.6 : phase === 'rewinding' ? 1.5 : 1.05

  return (
    <>
      <color attach="background" args={['#05050a']} />
      <Starfield reduceRef={reduceRef} count={1500} />
      <Nebula />
      <Belt scrollRef={scrollRef} reduceRef={reduceRef} explosionRef={explosionRef} beltRef={beltRef} />
      <Debris explosionRef={explosionRef} beltRef={beltRef} />
      <Fragments explosionRef={explosionRef} beltRef={beltRef} />
      <Shockwave explosionRef={explosionRef} />
      <CameraShake explosionRef={explosionRef} />
      <EffectComposer multisampling={2}>
        <Bloom intensity={bloomIntensity} luminanceThreshold={0.6} luminanceSmoothing={0.28} mipmapBlur />
        <Vignette offset={0.24} darkness={0.8} eskil={false} />
      </EffectComposer>
    </>
  )
}

/**
 * CosmicBackground — a fixed full-viewport 3D "solar-system belt" scene.
 * Full quality (DPR 1.6, MSAA, 5-octave FBM, 1500 stars). Exposes the
 * explode / rewind phases through the cosmic store (see ExplosionButton).
 */
export function CosmicBackground() {
  const scrollRef = useRef(0)
  const reduceMotion = usePreferencesStore((s) => s.reduceMotion)
  const reduceRef = useRef(reduceMotion)
  reduceRef.current = reduceMotion

  const explosionRef = useRef<ExplosionState>({ progress: 0 })
  const beltRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      scrollRef.current = Math.min(1, Math.max(0, window.scrollY / max))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }} aria-hidden="true">
      <ErrorBoundary
        fallback={
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,#0b0b1d_0%,#080812_55%,#05050a_100%)]" />
        }
      >
        <Canvas
          dpr={[1, 1.6]}
          camera={{ position: [0, 9, 18], fov: 46, near: 0.1, far: 260 }}
          gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => gl.setClearColor('#05050a')}
        >
          <Scene scrollRef={scrollRef} reduceRef={reduceRef} explosionRef={explosionRef} beltRef={beltRef} />
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}
