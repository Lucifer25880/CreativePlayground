import { Suspense, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { workService } from '@/services/workService'
import { promptService } from '@/services/promptService'
import { getExperiment, getExperimentComponents } from '@/experiments/registry/registry'
import { useWorkStore } from '@/stores/workStore'
import { usePlaygroundStore } from '@/stores/playgroundStore'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { toast } from '@/components/common/Toast'
import { downloadJson } from '@/utils/download'
import { formatDate } from '@/utils/format'
import { Icon } from '@/components/common/Icon'

export default function WorkDetail() {
  const { workId } = useParams()
  const navigate = useNavigate()
  const refresh = useWorkStore((s) => s.refresh)
  const [work, setWork] = useState(() => (workId ? workService.get(workId) : null))
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(work?.title ?? '')
  const [description, setDescription] = useState(work?.description ?? '')

  if (!work) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-slate-400">Work not found.</p>
        <Link to="/works" className="btn-ghost">Back to My Works</Link>
      </div>
    )
  }

  const experiment = work.sourceExperimentId ? getExperiment(work.sourceExperimentId) : undefined
  const prompts = work.promptIds.map((id) => promptService.get(id)).filter(Boolean)

  function reload() {
    setWork(workId ? workService.get(workId) : null)
    refresh()
  }

  function handleSaveEdit() {
    workService.update(work!.id, { title: title.trim() || work!.title, description })
    setEditing(false)
    reload()
    toast('已保存')
  }

  function handleOpenInPlayground() {
    if (!work!.sourceExperimentId) {
      toast('该作品没有关联实验', 'error')
      return
    }
    usePlaygroundStore.getState().seedPlayground({ experimentId: work!.sourceExperimentId, config: work!.config })
    navigate(`/playground/${work!.sourceExperimentId}`)
  }

  function handleDelete() {
    if (confirm('删除此作品？')) {
      workService.remove(work!.id)
      refresh()
      navigate('/works')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to="/works" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <Icon name="arrow-left" size={15} /> My Works
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* cover */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
          <div className="aspect-[16/10]">
            {experiment ? (
              <Cover experimentId={work.sourceExperimentId!} />
            ) : (
              <div className="grid-bg flex h-full w-full items-center justify-center">
                <Icon name="folder" size={36} className="text-slate-700" />
              </div>
            )}
          </div>
        </div>

        {/* info */}
        <div className="card-surface p-6">
          {editing ? (
            <div className="space-y-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-base" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-base h-24 resize-none" placeholder="作品描述" />
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} className="btn-primary"><Icon name="save" size={15} /> Save</button>
                <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-white">{work.title}</h1>
                  <p className="mt-1 text-xs text-slate-500">created {formatDate(work.createdAt)} · updated {formatDate(work.updatedAt)}</p>
                </div>
                <button
                  onClick={() => {
                    workService.toggleFavorite(work!.id)
                    reload()
                  }}
                  className={`rounded-xl border border-white/10 p-2.5 ${work.favorite ? 'text-accent-pink' : 'text-slate-400'}`}
                >
                  <Icon name={work.favorite ? 'heart-filled' : 'heart'} size={18} />
                </button>
              </div>
              {work.description && <p className="mt-3 text-sm text-slate-300">{work.description}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="chip !text-[11px]">{work.sourceType}</span>
                {experiment && <Link to={`/explore/${experiment.id}`} className="chip !text-[11px] hover:text-white">来源：{experiment.name}</Link>}
                {work.tags.map((t) => <span key={t} className="chip !text-[11px]">{t}</span>)}
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button onClick={handleOpenInPlayground} className="btn-primary w-full">
                  <Icon name="play" size={16} /> Open in Playground
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {experiment && (
                    <Link to={`/prompt-generator/${experiment.id}`} className="btn-ghost">
                      <Icon name="sparkles" size={15} /> Generate Prompt
                    </Link>
                  )}
                  <button onClick={() => { setEditing(true); setTitle(work!.title); setDescription(work!.description) }} className="btn-ghost">
                    <Icon name="edit" size={15} /> Edit
                  </button>
                  <button onClick={() => downloadJson(`${work!.title}.work.json`, work)} className="btn-ghost">
                    <Icon name="download" size={15} /> Export
                  </button>
                  <button onClick={handleDelete} className="btn-danger">
                    <Icon name="trash" size={15} /> Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* config + prompts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-6">
          <div className="panel-title">参数配置</div>
          <pre className="mt-3 max-h-72 overflow-auto rounded-xl border border-white/10 bg-ink-950 p-4 font-mono text-xs text-slate-300">
            {JSON.stringify(work.config, null, 2)}
          </pre>
        </div>

        <div className="card-surface p-6">
          <div className="panel-title">关联提示词（{prompts.length}）</div>
          {prompts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">尚未关联提示词。从提示词库生成后会自动关联。</p>
          ) : (
            <div className="mt-3 space-y-2">
              {prompts.map((p) => (
                <Link key={p!.id} to={`/prompts/${p!.id}`} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 hover:border-white/20">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{p!.title}</div>
                    <div className="text-xs text-slate-500">V{p!.currentVersion} · {p!.generationMode}</div>
                  </div>
                  <Icon name="chevron-right" size={15} className="text-slate-500" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Cover({ experimentId }: { experimentId: string }) {
  const components = getExperimentComponents(experimentId)
  const exp = getExperiment(experimentId)
  if (!components || !exp) return null
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
