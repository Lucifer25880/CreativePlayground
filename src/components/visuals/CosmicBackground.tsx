import { useEffect, useRef, type MutableRefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Starfield } from './cosmic/Starfield'
import { Nebula } from './cosmic/Nebula'
import { Belt } from './cosmic/Belt'

function Scene({
  scrollRef,
  reduceRef,
}: {
  scrollRef: MutableRefObject<number>
  reduceRef: MutableRefObject<boolean>
}) {
  return (
    <>
      <color attach="background" args={['#05050a']} />
      <Starfield reduceRef={reduceRef} count={1500} />
      <Nebula />
      <Belt scrollRef={scrollRef} reduceRef={reduceRef} />
      <EffectComposer multisampling={2}>
        <Bloom intensity={1.05} luminanceThreshold={0.6} luminanceSmoothing={0.28} mipmapBlur />
        <Vignette offset={0.24} darkness={0.8} eskil={false} />
      </EffectComposer>
    </>
  )
}

/**
 * CosmicBackground — a fixed full-viewport 3D "solar-system belt" scene.
 * Full visual quality (DPR 1.6, MSAA, 5-octave FBM, 1500 stars). The nebula is
 * pre-baked so its expensive noise is not recomputed every frame.
 */
export function CosmicBackground() {
  const scrollRef = useRef(0)
  const reduceMotion = usePreferencesStore((s) => s.reduceMotion)
  const reduceRef = useRef(reduceMotion)
  reduceRef.current = reduceMotion

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
          <Scene scrollRef={scrollRef} reduceRef={reduceRef} />
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}
