import { useCosmicStore } from '@/stores/cosmicStore'
import { Icon } from '@/components/common/Icon'

/**
 * Explosion / rewind trigger.
 * idle → "引爆星环" (explosion icon)   exploded → "回溯星环" (rewind icon)
 */
export function ExplosionButton({ large = false }: { large?: boolean }) {
  const phase = useCosmicStore((s) => s.phase)
  const explode = useCosmicStore((s) => s.explode)
  const rewind = useCosmicStore((s) => s.rewind)

  const busy = phase === 'exploding' || phase === 'rewinding'
  const exploded = phase === 'exploded'

  const onClick = () => {
    if (busy) return
    // Bring the hero into view so the full explosion is visible.
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    if (phase === 'idle') explode()
    else if (phase === 'exploded') rewind()
  }

  const label = busy
    ? phase === 'exploding'
      ? '引爆中…'
      : '回溯中…'
    : exploded
      ? '回溯星环'
      : '引爆星环'

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`relative inline-flex items-center justify-center gap-2 rounded-full border font-semibold backdrop-blur transition-all ${
        large ? 'px-8 py-4 text-base' : 'px-6 py-3 text-sm'
      } ${
        exploded
          ? 'border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan shadow-[0_0_44px_-8px_rgba(56,225,255,0.75)] hover:bg-accent-cyan/25'
          : 'border-rose-400/50 bg-rose-500/15 text-rose-200 shadow-[0_0_44px_-8px_rgba(255,92,168,0.75)] hover:bg-rose-500/25'
      } ${busy ? 'cursor-wait opacity-80' : 'hover:scale-105 active:scale-95'}`}
    >
      <Icon name={exploded ? 'reset' : 'explosion'} size={large ? 22 : 18} className={busy ? 'animate-spin' : ''} />
      <span>{label}</span>
    </button>
  )
}
