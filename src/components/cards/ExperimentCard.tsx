import { Suspense, memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { ExperimentDefinition } from '@/types/experiment'
import { getExperimentComponents } from '@/experiments/registry/registry'
import { getCategory } from '@/experiments/registry/categories'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useInView } from '@/hooks/useInView'
import { Icon } from '@/components/common/Icon'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { DifficultyBadge, TagChip } from '@/components/common/Badges'

function PreviewThumb({ experiment }: { experiment: ExperimentDefinition }) {
  const components = getExperimentComponents(experiment.id)
  if (!components) return <PreviewFallback label={experiment.name} />
  const Preview = components.Preview
  return (
    <ErrorBoundary fallback={<PreviewFallback label={experiment.name} />}>
      <Suspense fallback={<PreviewFallback label={experiment.name} />}>
        <div className="pointer-events-none h-full w-full">
          <Preview config={experiment.defaultConfig} preview />
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}

function PreviewFallback({ label }: { label: string }) {
  return (
    <div className="grid-bg flex h-full w-full items-center justify-center bg-ink-900">
      <span className="animate-pulse-soft text-xs text-slate-600">{label}</span>
    </div>
  )
}

export const ExperimentCard = memo(function ExperimentCard({
  experiment,
  index = 0,
}: {
  experiment: ExperimentDefinition
  index?: number
}) {
  const category = getCategory(experiment.category)
  const isFav = usePreferencesStore((s) => s.favoriteExperiments.includes(experiment.id))
  const toggleFav = usePreferencesStore((s) => s.toggleFavoriteExperiment)
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-800/50 transition-all hover:border-accent/40 hover:shadow-glow"
    >
      {/* preview */}
      <Link to={`/explore/${experiment.id}`} className="relative block aspect-[16/10] overflow-hidden">
        <div ref={ref} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]">
          {inView ? <PreviewThumb experiment={experiment} /> : <PreviewFallback label={experiment.name} />}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <DifficultyBadge level={experiment.difficulty} />
        </div>
        {/* play affordance */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
            <Icon name="play" size={18} />
          </span>
        </div>
      </Link>

      {/* body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {category && (
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-accent-cyan">
                  <Icon name={category.icon as never} size={13} />
                </span>
              )}
              <span className="truncate text-[11px] text-slate-500">{category?.name}</span>
            </div>
            <Link
              to={`/explore/${experiment.id}`}
              className="mt-1.5 block truncate text-[15px] font-semibold text-white transition-colors hover:text-accent-cyan"
            >
              {experiment.name}
            </Link>
          </div>
          <button
            onClick={() => toggleFav(experiment.id)}
            aria-label="Toggle favorite"
            className={`shrink-0 rounded-lg p-1.5 transition-colors ${
              isFav ? 'text-accent-pink' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon name={isFav ? 'heart-filled' : 'heart'} size={16} />
          </button>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{experiment.description}</p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {experiment.tags.slice(0, 3).map((t) => (
            <TagChip key={t} tag={t} />
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2 border-t border-white/[0.06] pt-3">
          <Link to={`/explore/${experiment.id}`} className="btn-ghost flex-1 !py-2 text-xs">
            Details
          </Link>
          <Link to={`/playground/${experiment.id}`} className="btn-primary flex-1 !py-2 text-xs">
            <Icon name="play" size={13} />
            Play
          </Link>
        </div>
      </div>
    </motion.div>
  )
})
