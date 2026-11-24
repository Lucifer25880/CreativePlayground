import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listExperiments, getExperiment } from '@/experiments/registry/registry'
import { getCategory } from '@/experiments/registry/categories'
import { configService } from '@/services/configService'
import { usePlaygroundStore } from '@/stores/playgroundStore'
import { DifficultyBadge } from '@/components/common/Badges'
import { Icon } from '@/components/common/Icon'
import { timeAgo } from '@/utils/format'

export default function PlaygroundHome() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const experiments = useMemo(() => listExperiments(), [])
  const saved = useMemo(() => configService.list(), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return experiments
    return experiments.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }, [experiments, query])

  function openRandom() {
    const e = experiments[Math.floor(Math.random() * experiments.length)]
    navigate(`/playground/${e.id}`)
  }

  function resume(experimentId: string) {
    const record = saved.find((s) => s.experimentId === experimentId)
    if (record) {
      usePlaygroundStore.getState().seedPlayground({ experimentId, config: record.config })
    }
    navigate(`/playground/${experimentId}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-accent/15 via-ink-800 to-accent-cyan/10 p-8 sm:p-10">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-300">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent-cyan" />
              Live Playground
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">实验室</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              直接进入实验，实时调节参数。选择一个实验开始，或一键随机进入。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={openRandom} className="btn-primary px-5 py-2.5">
              <Icon name="shuffle" size={16} /> 随机实验
            </button>
            <Link to="/explore" className="btn-ghost px-5 py-2.5">
              <Icon name="compass" size={16} /> 去展厅浏览
            </Link>
          </div>
        </div>
      </div>

      {/* saved sessions */}
      {saved.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Icon name="clock" size={17} className="text-accent-cyan" />
              继续上次的实验
            </h2>
            <span className="text-xs text-slate-500">共 {saved.length} 个已保存配置</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {saved.slice(0, 6).map((record) => {
              const exp = getExperiment(record.experimentId)
              if (!exp) return null
              return (
                <button
                  key={record.id}
                  onClick={() => resume(record.experimentId)}
                  className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-all hover:border-accent/40 hover:bg-white/[0.06]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-accent/25 to-accent-cyan/20 text-accent-cyan">
                    <Icon name="flask" size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{exp.name}</span>
                    <span className="block text-[11px] text-slate-500">
                      {record.name ?? '已保存配置'} · {timeAgo(record.updatedAt)}
                    </span>
                  </span>
                  <Icon name="chevron-right" size={16} className="text-slate-500 group-hover:text-white" />
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* launcher */}
      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">选择一个实验</h2>
          <div className="relative w-full sm:w-72">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索实验…"
              className="input-base py-2 pl-9"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((exp) => {
            const category = getCategory(exp.category)
            const isSaved = saved.some((s) => s.experimentId === exp.id)
            return (
              <div
                key={exp.id}
                className="group flex flex-col rounded-2xl border border-white/[0.08] bg-ink-800/50 p-4 transition-all hover:border-accent/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-accent-cyan">
                    <Icon name={(category?.icon ?? 'cube') as never} size={16} />
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isSaved && (
                      <span className="rounded-full border border-accent-lime/30 bg-accent-lime/10 px-2 py-0.5 text-[10px] text-accent-lime">
                        已保存
                      </span>
                    )}
                    <DifficultyBadge level={exp.difficulty} />
                  </div>
                </div>
                <Link
                  to={`/playground/${exp.id}`}
                  className="mt-3 truncate text-[15px] font-semibold text-white hover:text-accent-cyan"
                >
                  {exp.name}
                </Link>
                <p className="mt-1 line-clamp-2 text-xs text-slate-400">{exp.description}</p>
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <span className="truncate text-[11px] text-slate-500">{category?.name}</span>
                  <Link
                    to={`/playground/${exp.id}`}
                    className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs text-slate-200 transition-colors hover:bg-accent/20 hover:text-white"
                  >
                    <Icon name="play" size={12} /> 打开
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Icon name="search" size={28} className="text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">没有匹配的实验。</p>
          </div>
        )}
      </section>
    </div>
  )
}
