import { Suspense, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getExperiment, getExperimentComponents } from '@/experiments/registry/registry'
import { normalizeConfig, randomizeConfig, applyPreset } from '@/engine/parameter-engine/parameterEngine'
import { remixService } from '@/services/remixService'
import { workService } from '@/services/workService'
import { useRemixStore } from '@/stores/remixStore'
import { useWorkStore } from '@/stores/workStore'
import { ControlPanel } from '@/components/controls/ControlPanel'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Modal } from '@/components/common/Modal'
import { toast } from '@/components/common/Toast'
import { diffConfig } from '@/utils/config'
import { Icon } from '@/components/common/Icon'
import { useBack } from '@/hooks/useBack'
import type { ConfigValue, ExperimentConfig } from '@/types/config'

export default function RemixStudio() {
  const { remixId } = useParams()
  const navigate = useNavigate()
  const back = useBack('/studio')
  const [remix, setRemix] = useState(() => (remixId ? remixService.get(remixId) : null))
  const [config, setConfig] = useState<ExperimentConfig>(() => (remixId ? remixService.get(remixId)?.config ?? {} : {}))
  const [title, setTitle] = useState(() => remixService.get(remixId ?? '')?.title ?? '')
  const [dirty, setDirty] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [showSaveWork, setShowSaveWork] = useState(false)
  const [workTitle, setWorkTitle] = useState('')

  const experiment = remix ? getExperiment(remix.sourceExperimentId) : undefined
  const components = experiment ? getExperimentComponents(experiment.id) : null
  const versions = useMemo(() => (remix ? remixService.versions(remix.id) : []), [remix])

  if (!remix || !experiment) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Remix not found.</p>
        <Link to="/studio" className="btn-ghost">Back to Studio</Link>
      </div>
    )
  }

  const modifiedIds = useMemo(() => {
    const base = normalizeConfig(experiment)
    return new Set(Object.keys(diffConfig(base, config)))
  }, [config, experiment])

  function updateParam(id: string, value: ConfigValue) {
    setConfig((prev) => ({ ...prev, [id]: value }))
    setDirty(true)
  }

  function handleSaveVersion() {
    remixService.saveVersion(remix!.id, config, `Edited · ${new Date().toLocaleString()}`)
    remixService.update(remix!.id, { title: title.trim() || remix!.title })
    setRemix(remixService.get(remix!.id))
    useRemixStore.getState().refresh()
    setDirty(false)
    toast('已保存新版本')
  }

  function handleRestore(versionId: string) {
    const r = remixService.restoreVersion(remix!.id, versionId)
    if (r) {
      setRemix(r)
      setConfig(r.config)
      setDirty(false)
      toast('已恢复历史版本', 'info')
    }
  }

  function handleSaveAsWork() {
    const work = workService.create({
      title: workTitle.trim() || `${remix!.title}`,
      sourceType: 'remix',
      sourceExperimentId: remix!.sourceExperimentId,
      sourceRemixId: remix!.id,
      config,
      tags: experiment!.tags,
    })
    useWorkStore.getState().refresh()
    toast('已保存为作品')
    navigate(`/works/${work.id}`)
  }

  function handleDelete() {
    if (confirm('删除此 Remix 及其所有版本？')) {
      remixService.remove(remix!.id)
      useRemixStore.getState().refresh()
      navigate('/studio')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-ink-900/80 px-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={back} className="btn-ghost !px-2.5 !py-1.5">
            <Icon name="arrow-left" size={16} />
          </button>
          <div className="min-w-0">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setDirty(true)
              }}
              className="w-64 truncate border-none bg-transparent text-sm font-semibold text-white outline-none"
            />
            <div className="truncate text-[11px] text-slate-500">
              Remix · 来源：{experiment.name} · V{remix.currentVersion} · {dirty ? '未保存' : '已保存'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowVersions(true)} className="btn-ghost !px-2.5 !py-1.5" title="Versions">
            <Icon name="git-branch" size={16} />
            <span className="hidden sm:inline">Versions</span>
          </button>
          <button
            onClick={() => {
              setConfig(randomizeConfig(experiment))
              setDirty(true)
            }}
            className="btn-ghost !px-2.5 !py-1.5"
            title="Randomize"
          >
            <Icon name="shuffle" size={16} />
          </button>
          <button
            onClick={() => {
              setConfig(normalizeConfig(experiment))
              setDirty(true)
            }}
            className="btn-ghost !px-2.5 !py-1.5"
            title="Reset"
          >
            <Icon name="reset" size={16} />
          </button>
          <Link to={`/prompt-generator/${experiment.id}`} className="btn-ghost !px-2.5 !py-1.5" title="Generate prompt">
            <Icon name="sparkles" size={16} />
          </Link>
          <button onClick={() => setShowSaveWork(true)} className="btn-ghost !px-2.5 !py-1.5" title="Save as work">
            <Icon name="folder" size={16} />
            <span className="hidden sm:inline">Save as Work</span>
          </button>
          <button onClick={handleDelete} className="btn-danger !px-2.5 !py-1.5" title="Delete">
            <Icon name="trash" size={16} />
          </button>
          <button onClick={handleSaveVersion} className="btn-primary !px-3 !py-1.5 text-xs">
            <Icon name="save" size={14} /> Save Version
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[320px] shrink-0 flex-col border-r border-white/[0.06] bg-ink-900/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="panel-title">Parameters</span>
            <span className="text-[11px] text-slate-500">{modifiedIds.size} modified</span>
          </div>
          <ControlPanel schema={experiment.parameterSchema} config={config} onChange={updateParam} modifiedIds={modifiedIds} />
        </aside>

        <main className="relative min-w-0 flex-1 bg-ink-950">
          {components ? (
            <ErrorBoundary>
              <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-600">Loading…</div>}>
                <components.Renderer config={config} />
              </Suspense>
            </ErrorBoundary>
          ) : null}
        </main>
      </div>

      {/* versions modal */}
      <Modal open={showVersions} onClose={() => setShowVersions(false)} title="版本历史">
        <div className="space-y-2">
          {versions.length === 0 && <p className="text-sm text-slate-500">还没有版本记录。</p>}
          {[...versions].reverse().map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <div>
                <div className="text-sm font-medium text-white">V{v.versionNumber}</div>
                <div className="text-xs text-slate-500">{v.description ?? ''} · {new Date(v.createdAt).toLocaleString()}</div>
              </div>
              <button onClick={() => { handleRestore(v.id); setShowVersions(false) }} className="btn-ghost !px-2.5 !py-1 text-xs">
                <Icon name="reset" size={13} /> Restore
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* save as work modal */}
      <Modal open={showSaveWork} onClose={() => setShowSaveWork(false)} title="保存为作品">
        <label className="panel-title">作品名称</label>
        <input
          value={workTitle}
          onChange={(e) => setWorkTitle(e.target.value)}
          placeholder={`${remix.title}`}
          className="input-base mt-2"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setShowSaveWork(false)} className="btn-ghost">Cancel</button>
          <button onClick={handleSaveAsWork} className="btn-primary"><Icon name="save" size={15} /> Save Work</button>
        </div>
      </Modal>
    </div>
  )
}
