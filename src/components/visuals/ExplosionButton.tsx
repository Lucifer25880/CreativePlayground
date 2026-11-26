import { useCosmicStore } from '@/stores/cosmicStore'
import { Icon } from '@/components/common/Icon'

/** Small icon-only detonator. idle → explosion icon, exploded → rewind icon. */
export function ExplosionButton() {
  const phase = useCosmicStore((s) => s.phase)
  const explode = useCosmicStore((s) => s.explode)
  const rewind = useCosmicStore((s) => s.rewind)

  const busy = phase === 'exploding' || phase === 'rewinding'
  const exploded = phase === 'exploded'

  const onClick = () => {
    if (busy) return
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    if (phase === 'idle') explode()
    else if (phase === 'exploded') rewind()
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-label={exploded ? '回溯星环' : '引爆星环'}
      title={exploded ? '回溯星环' : '引爆星环'}
      className={`flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur transition-all ${
        exploded
          ? 'border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan shadow-[0_0_40px_-6px_rgba(56,225,255,0.8)] hover:bg-accent-cyan/25'
          : 'border-rose-400/50 bg-rose-500/15 text-rose-200 shadow-[0_0_40px_-6px_rgba(255,92,168,0.8)] hover:bg-rose-500/25'
      } ${busy ? 'cursor-wait opacity-70' : 'hover:scale-110 active:scale-95'}`}
    >
      <Icon name={exploded ? 'reset' : 'explosion'} size={22} className={busy ? 'animate-spin' : ''} />
    </button>
  )
}
