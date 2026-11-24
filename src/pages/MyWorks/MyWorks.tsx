import { Suspense, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useWorkStore } from '@/stores/workStore'
import { workService } from '@/services/workService'
import { getExperiment, getExperimentComponents } from '@/experiments/registry/registry'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { usePlaygroundStore } from '@/stores/playgroundStore'
import { toast } from '@/components/common/Toast'
import { downloadJson, readFileAsText } from '@/utils/download'
import { timeAgo } from '@/utils/format'
import { Icon } from '@/components/common/Icon'
import type { Work } from '@/types/work'

const SOURCE_LABEL: Record<Work['sourceType'], string> = {
  experiment: '实验',
  remix: 'Remix',
  composition: '组合',
  custom: '自定义',
}

export default function MyWorks() {
  const works = useWorkStore((s) => s.works)
  const refresh = useWorkStore((s) => s.refresh)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [favOnly, setFavOnly] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    let list = works
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((w) => w.title.toLowerCase().includes(q) || w.tags.some((t) => t.toLowerCase().includes(q)))
    if (favOnly) list = list.filter((w) => w.favorite)
    return list
  }, [works, query, favOnly])

  function handleDelete(id: string) {
    if (confirm('删除此作品？')) {
      workService.remove(id)
      refresh()
      toast('已删除作品', 'info')
    }
  }

  function handleToggleFav(id: string) {
    workService.toggleFavorite(id)
    refresh()
  }

  function handleDuplicate(w: Work) {
    const copy = workService.create({
      title: `${w.title} (copy)`,
      description: w.description,
      sourceType: w.sourceType,
      sourceExperimentId: w.sourceExperimentId,
      sourceRemixId: w.sourceRemixId,
      config: w.config,
      tags: w.tags,
    })
    refresh()
    toast('已复制作品')
    navigate(`/works/${copy.id}`)
  }

  function handleOpenInPlayground(w: Work) {
    if (!w.sourceExperimentId) {
      toast('该作品没有关联实验，无法在 Playground 打开', 'error')
      return
    }
    usePlaygroundStore.getState().seedPlayground({ experimentId: w.sourceExperimentId, config: w.config })
    navigate(`/playground/${w.sourceExperimentId}`)
  }

  function handleExport(w: Work) {
    downloadJson(`${w.title}.work.json`, w)
  }

  async function handleImport(file: File) {
    try {
      const text = await readFileAsText(file)
      const data = JSON.parse(text)
      if (!data || typeof data !== 'object' || typeof data.config !== 'object' || typeof data.title !== 'string') {
        throw new Error('Invalid work format')
      }
      workService.create({
        title: data.title,
        description: data.description ?? '',
        sourceType: data.sourceType ?? 'custom',
        sourceExperimentId: data.sourceExperimentId,
        sourceRemixId: data.sourceRemixId,
        config: data.config,
        tags: data.tags ?? [],
      })
      refresh()
      toast('作品已导入')
    } catch (err) {
      toast(`导入失败：${err instanceof Error ? err.message : '格式错误'}`, 'error')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">我的作品</h1>
          <p className="mt-2 text-sm text-slate-400">统一管理你的实验配置、Remix 与组合效果。</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => importRef.current?.click()} className="btn-ghost shrink-0">
            <Icon name="external" size={15} /> Import
          </button>
          <Link to="/explore" className="btn-primary shrink-0">
            <Icon name="plus" size={15} /> New
          </Link>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImport(f)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索作品名称或标签…" className="input-base py-2.5 pl-9" />
        </div>
        <button
          onClick={() => setFavOnly((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs ${favOnly ? 'border-accent-pink/50 bg-accent-pink/10 text-accent-pink' : 'border-white/10 text-slate-400'}`}
        >
          <Icon name={favOnly ? 'heart-filled' : 'heart'} size={13} /> Favorites
        </button>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Icon name="folder" size={32} className="text-slate-600" />
          <p className="mt-4 text-sm text-slate-400">{works.length === 0 ? '还没有作品。从一个实验开始创作吧。' : '没有匹配的作品。'}</p>
          {works.length === 0 && (
            <Link to="/explore" className="btn-primary mt-5"><Icon name="flask" size={15} /> Explore Experiments</Link>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((w) => (
            <WorkCard
              key={w.id}
              work={w}
              onDelete={handleDelete}
              onToggleFav={handleToggleFav}
              onDuplicate={handleDuplicate}
              onOpen={handleOpenInPlayground}
              onExport={handleExport}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function WorkCard({
  work,
  onDelete,
  onToggleFav,
  onDuplicate,
  onOpen,
  onExport,
}: {
  work: Work
  onDelete: (id: string) => void
  onToggleFav: (id: string) => void
  onDuplicate: (w: Work) => void
  onOpen: (w: Work) => void
  onExport: (w: Work) => void
}) {
  const experiment = work.sourceExperimentId ? getExperiment(work.sourceExperimentId) : undefined
  return (
    <div className="group card-surface flex flex-col overflow-hidden">
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden border-b border-white/[0.06] bg-ink-900">
        {experiment ? <WorkCover experimentId={work.sourceExperimentId!} /> : (
          <div className="grid-bg flex h-full w-full items-center justify-center">
            <Icon name="folder" size={28} className="text-slate-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
        <span className="absolute left-2 top-2 chip !text-[10px]">{SOURCE_LABEL[work.sourceType]}</span>
        <button
          onClick={() => onOpen(work)}
          className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
          title="Open in Playground"
        >
          <Icon name="play" size={20} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/works/${work.id}`} className="truncate text-[15px] font-semibold text-white hover:text-accent-cyan">
            {work.title}
          </Link>
          <button
            onClick={() => onToggleFav(work.id)}
            className={`shrink-0 ${work.favorite ? 'text-accent-pink' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Icon name={work.favorite ? 'heart-filled' : 'heart'} size={15} />
          </button>
        </div>
        {experiment && <div className="mt-1 truncate text-xs text-slate-500">来源：{experiment.name}</div>}
        {work.description && <p className="mt-2 line-clamp-2 text-xs text-slate-400">{work.description}</p>}

        <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-slate-500">
          <span>{timeAgo(work.updatedAt)}</span>
          <div className="flex gap-1">
            <button onClick={() => onDuplicate(work)} className="rounded-md p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white" title="Duplicate">
              <Icon name="copy" size={13} />
            </button>
            <button onClick={() => onExport(work)} className="rounded-md p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white" title="Export">
              <Icon name="download" size={13} />
            </button>
            <button onClick={() => onDelete(work.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300" title="Delete">
              <Icon name="trash" size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkCover({ experimentId }: { experimentId: string }) {
  const exp = getExperiment(experimentId)
  const components = getExperimentComponents(experimentId)
  if (!exp || !components) return null
  const Preview = components.Preview
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="grid-bg h-full w-full" />}>
        <div className="pointer-events-none h-full w-full">
          <Preview config={exp.defaultConfig} preview />
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}
