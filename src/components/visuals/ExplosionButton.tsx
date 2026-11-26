import { useCosmicStore } from '@/stores/cosmicStore'
import { Icon } from '@/components/common/Icon'

/** Tiny icon-only detonator (bottom-left). idle → explosion icon, exploded → rewind icon. */
export function ExplosionButton({
  onExplode,
  onRewind,
  arming = false,
}: {
  onExplode: () => void
  onRewind: () => void
  arming?: boolean
}) {
  const phase = useCosmicStore((s) => s.phase)
  const busy = phase === 'exploding' || phase === 'rewinding' || arming
  const exploded = phase === 'exploded'

  const onClick = () => {
    if (busy) return
    if (phase === 'idle') onExplode()
    else if (phase === 'exploded') onRewind()
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-label={exploded ? '回溯星环' : '引爆星环'}
      title={exploded ? '回溯星环' : '引爆星环'}
      className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur transition-all ${
        exploded
          ? 'border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan shadow-[0_0_34px_-6px_rgba(56,225,255,0.8)] hover:bg-accent-cyan/25'
          : 'border-rose-400/50 bg-rose-500/15 text-rose-200 shadow-[0_0_34px_-6px_rgba(255,92,168,0.8)] hover:bg-rose-500/25'
      } ${busy ? 'cursor-wait opacity-70' : 'hover:scale-110 active:scale-95'}`}
    >
      <Icon name={exploded ? 'reset' : 'explosion'} size={18} className={busy ? 'animate-spin' : ''} />
    </button>
  )
}
