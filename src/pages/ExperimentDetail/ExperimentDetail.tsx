import { Suspense } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getExperiment, getExperimentComponents, experimentsByCategory } from '@/experiments/registry/registry'
import { getCategory } from '@/experiments/registry/categories'
import { remixService } from '@/services/remixService'
import { useRemixStore } from '@/stores/remixStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { DifficultyBadge, TagChip, CategoryBadge } from '@/components/common/Badges'
import { ExperimentCard } from '@/components/cards/ExperimentCard'
import { Icon } from '@/components/common/Icon'

export default function ExperimentDetail() {
  const { experimentId } = useParams()
  const navigate = useNavigate()
  const experiment = experimentId ? getExperiment(experimentId) : undefined
  const isFav = usePreferencesStore((s) => (experiment ? s.favoriteExperiments.includes(experiment.id) : false))
  const toggleFav = usePreferencesStore((s) => s.toggleFavoriteExperiment)

  if (!experiment) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-slate-400">Experiment not found.</p>
        <Link to="/explore" className="btn-ghost">Back to Explore</Link>
      </div>
    )
  }

  const category = getCategory(experiment.category)
  const components = getExperimentComponents(experiment.id)
  const related = experimentsByCategory(experiment.category).filter((d) => d.id !== experiment.id).slice(0, 3)

  function handleRemix() {
    const remix = remixService.create({
      title: `${experiment!.name} Remix`,
      sourceExperimentId: experiment!.id,
      config: experiment!.defaultConfig,
    })
    useRemixStore.getState().refresh()
    navigate(`/studio/remix/${remix.id}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link to="/explore" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <Icon name="arrow-left" size={15} /> Back to Explore
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Hero preview */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
          <div className="aspect-[16/10]">
            {components ? (
              <ErrorBoundary>
                <Suspense fallback={<PreviewFallback />}>
                  <components.Renderer config={experiment.defaultConfig} />
                </Suspense>
              </ErrorBoundary>
            ) : (
              <PreviewFallback />
            )}
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink-950/80 to-transparent p-4">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{experiment.name}</h1>
                <p className="text-sm text-slate-300">{category?.name}</p>
              </div>
              <button
                onClick={() => toggleFav(experiment.id)}
                className={`rounded-xl border border-white/10 bg-ink-950/60 p-2.5 backdrop-blur ${
                  isFav ? 'text-accent-pink' : 'text-slate-400'
                }`}
              >
                <Icon name={isFav ? 'heart-filled' : 'heart'} size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Info + actions */}
        <div className="flex flex-col gap-4">
          <div className="card-surface p-6">
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge level={experiment.difficulty} />
              <CategoryBadge category={experiment.category} />
              <span className="chip">v{experiment.version}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">{experiment.longDescription ?? experiment.description}</p>

            <div className="mt-5 flex flex-col gap-2.5">
              <Link to={`/playground/${experiment.id}`} className="btn-primary w-full">
                <Icon name="play" size={16} />
                Start Experiment
              </Link>
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={handleRemix} className="btn-ghost">
                  <Icon name="wand" size={15} />
                  Remix
                </button>
                <Link to={`/prompt-generator/${experiment.id}`} className="btn-ghost">
                  <Icon name="sparkles" size={15} />
                  Generate Prompt
                </Link>
              </div>
            </div>
          </div>

          <div className="card-surface p-6">
            <div className="panel-title">交互与动画</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li className="flex gap-2"><Icon name="pointer" size={15} className="mt-0.5 text-accent-cyan" /> {experiment.interactionSchema.description ?? '鼠标交互'}</li>
              <li className="flex gap-2"><Icon name="refresh" size={15} className="mt-0.5 text-accent-cyan" /> {experiment.animationSchema.description ?? '循环动画'}</li>
            </ul>
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <div className="panel-title">参数数量</div>
              <p className="mt-2 text-2xl font-bold text-white">{experiment.parameterSchema.length}</p>
              <p className="text-xs text-slate-500">个可实时调节的参数</p>
            </div>
          </div>
        </div>
      </div>

      {/* Parameters + presets */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-6">
          <div className="panel-title">可调参数</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {experiment.parameterSchema.map((p) => (
              <span key={p.id} className="chip !text-[11px]">
                {p.label}
              </span>
            ))}
          </div>
        </div>
        <div className="card-surface p-6">
          <div className="panel-title">预设配置</div>
          <div className="mt-3 space-y-2">
            {experiment.presets.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <span className="text-sm text-slate-200">{p.name}</span>
                {p.description && <span className="text-xs text-slate-500">{p.description}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* tags */}
      <div className="mt-6 flex flex-wrap gap-2">
        {experiment.tags.map((t) => (
          <TagChip key={t} tag={t} />
        ))}
      </div>

      {/* related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white">同类实验</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((exp, i) => (
              <ExperimentCard key={exp.id} experiment={exp} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PreviewFallback() {
  return (
    <div className="grid-bg flex h-full w-full items-center justify-center bg-ink-900">
      <span className="animate-pulse-soft text-sm text-slate-600">Loading experiment…</span>
    </div>
  )
}
