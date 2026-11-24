import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getExperiment, getExperimentComponents } from '@/experiments/registry/registry'
import { normalizeConfig, randomizeConfig, applyPreset } from '@/engine/parameter-engine/parameterEngine'
import { configService } from '@/services/configService'
import { remixService } from '@/services/remixService'
import { usePlaygroundStore } from '@/stores/playgroundStore'
import { useRemixStore } from '@/stores/remixStore'
import { useExperimentStore } from '@/stores/experimentStore'
import { ControlPanel } from '@/components/controls/ControlPanel'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Modal } from '@/components/common/Modal'
import { toast } from '@/components/common/Toast'
import { downloadJson, readFileAsText } from '@/utils/download'
import { diffConfig } from '@/utils/config'
import { Icon } from '@/components/common/Icon'
import type { ConfigValue, ExperimentConfig } from '@/types/config'

export default function Playground() {
  const { experimentId } = useParams()
  const navigate = useNavigate()
  const experiment = experimentId ? getExperiment(experimentId) : undefined
  const components = experiment ? getExperimentComponents(experiment.id) : null

  const [config, setConfig] = useState<ExperimentConfig>(() =>
    experiment ? normalizeConfig(experiment) : {},
  )
  const [presetId, setPresetId] = useState('default')
  const [dirty, setDirty] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [exportJson, setExportJson] = useState('')
  const importRef = useRef<HTMLInputElement>(null)
  const initedRef = useRef(false)

  // consume cross-route seed once
  useEffect(() => {
    if (!experiment || initedRef.current) return
    initedRef.current = true
    const seed = usePlaygroundStore.getState().consumeSeed()
    if (seed && seed.experimentId === experiment.id) {
      setConfig(normalizeConfig(experiment, seed.config))
      if (seed.presetId) setPresetId(seed.presetId)
    } else {
      const saved = configService.getForExperiment(experiment.id)
      if (saved) setConfig(normalizeConfig(experiment, saved.config))
    }
  }, [experiment])

  if (!experiment) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Experiment not found.</p>
        <Link to="/explore" className="btn-ghost">Back to Explore</Link>
      </div>
    )
  }

  const modifiedIds = useMemo(() => {
    const diff = diffConfig(experiment.defaultConfig, config)
    return new Set(Object.keys(diff))
  }, [config, experiment])

  function updateParam(id: string, value: ConfigValue) {
    setConfig((prev) => ({ ...prev, [id]: value }))
    setDirty(true)
  }

  function handleReset() {
    setConfig(normalizeConfig(experiment!))
    setPresetId('default')
    setDirty(false)
    toast('已恢复默认配置', 'info')
  }

  function handleRandomize() {
    setConfig(randomizeConfig(experiment!))
    setPresetId('random')
    setDirty(true)
    toast('已生成随机配置', 'info')
  }

  function handlePreset(id: string) {
    const preset = experiment!.presets.find((p) => p.id === id)
    if (!preset) return
    setConfig(applyPreset(config, preset.config))
    setPresetId(id)
    setDirty(true)
    setShowPresets(false)
  }

  function handleSave() {
    configService.save(experiment!.id, config)
    useExperimentStore.getState().refresh()
    setDirty(false)
    toast('配置已保存')
  }

  function handleRemix() {
    const remix = remixService.create({
      title: `${experiment!.name} Remix`,
      sourceExperimentId: experiment!.id,
      config,
    })
    useRemixStore.getState().refresh()
    navigate(`/studio/remix/${remix.id}`)
  }

  function handleExport() {
    const payload = { experimentId: experiment!.id, config, exportedAt: new Date().toISOString() }
    setExportJson(JSON.stringify(payload, null, 2))
    setShowExport(true)
  }

  function handleDownload() {
    downloadJson(`${experiment!.id}-config.json`, JSON.parse(exportJson))
  }

  async function handleImportFile(file: File) {
    try {
      const text = await readFileAsText(file)
      const data = JSON.parse(text)
      if (!data || typeof data !== 'object' || typeof data.config !== 'object') {
        throw new Error('Invalid format: missing "config" object')
      }
      if (data.experimentId && data.experimentId !== experiment!.id) {
        toast(`配置属于实验 ${data.experimentId}，已按当前实验合并参数`, 'info')
      }
      setConfig(normalizeConfig(experiment!, data.config))
      setDirty(true)
      toast('配置已导入')
    } catch (err) {
      toast(`导入失败：${err instanceof Error ? err.message : 'JSON 解析错误'}`, 'error')
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-ink-900/80 px-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <Link to={`/explore/${experiment.id}`} className="btn-ghost !px-2.5 !py-1.5" title="Back">
            <Icon name="arrow-left" size={16} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-white">{experiment.name}</h1>
              {dirty && <span className="h-1.5 w-1.5 shrink-0 animate-pulse-soft rounded-full bg-accent-amber" title="Unsaved changes" />}
            </div>
            <div className="truncate text-[11px] text-slate-500">Live Playground · {experiment.id}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => setPanelOpen((v) => !v)} className="btn-ghost !px-2.5 !py-1.5" title="Toggle panel">
            <Icon name="sliders" size={16} />
          </button>
          <button onClick={handleRandomize} className="btn-ghost !px-2.5 !py-1.5" title="Randomize">
            <Icon name="shuffle" size={16} />
          </button>
          <button onClick={handleReset} className="btn-ghost !px-2.5 !py-1.5" title="Reset">
            <Icon name="reset" size={16} />
          </button>
          <button onClick={() => setShowPresets(true)} className="btn-ghost hidden !px-2.5 !py-1.5 sm:flex" title="Presets">
            <Icon name="layers" size={16} />
          </button>
          <button onClick={() => setShowCompare(true)} className="btn-ghost hidden !px-2.5 !py-1.5 md:flex" title="Compare">
            <Icon name="compare" size={16} />
          </button>
          <button onClick={handleExport} className="btn-ghost hidden !px-2.5 !py-1.5 md:flex" title="Export / Import">
            <Icon name="download" size={16} />
          </button>
          <button onClick={() => importRef.current?.click()} className="btn-ghost hidden !px-2.5 !py-1.5 md:flex" title="Import">
            <Icon name="external" size={16} />
          </button>
          <button onClick={handleRemix} className="btn-ghost hidden !px-2.5 !py-1.5 lg:flex" title="Remix">
            <Icon name="wand" size={15} />
            <span className="hidden xl:inline">Remix</span>
          </button>
          <Link to={`/prompt-generator/${experiment.id}`} className="btn-ghost hidden !px-2.5 !py-1.5 lg:flex" title="Generate prompt">
            <Icon name="sparkles" size={15} />
            <span className="hidden xl:inline">Prompt</span>
          </Link>
          <button onClick={handleSave} className="btn-primary !px-3 !py-1.5 text-xs">
            <Icon name="save" size={14} />
            <span className="hidden sm:inline">Save</span>
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImportFile(f)
              e.target.value = ''
            }}
          />
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {panelOpen && (
          <aside className="flex w-[320px] shrink-0 flex-col border-r border-white/[0.06] bg-ink-900/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="panel-title">Parameters</span>
              <span className="text-[11px] text-slate-500">{modifiedIds.size} modified</span>
            </div>
            <ControlPanel
              schema={experiment.parameterSchema}
              config={config}
              onChange={updateParam}
              modifiedIds={modifiedIds}
            />
          </aside>
        )}

        <main className="relative min-w-0 flex-1 bg-ink-950">
          {components ? (
            <ErrorBoundary>
              <Suspense fallback={<CanvasFallback />}>
                <components.Renderer config={config} />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <CanvasFallback />
          )}
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg border border-white/10 bg-ink-950/60 px-2.5 py-1 text-[10px] text-slate-500 backdrop-blur">
            {experiment.rendererType} · live
          </div>
        </main>
      </div>

      {/* Presets modal */}
      <Modal open={showPresets} onClose={() => setShowPresets(false)} title="预设配置">
        <div className="grid gap-2">
          {experiment.presets.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePreset(p.id)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                presetId === p.id
                  ? 'border-accent/50 bg-accent/10 text-white'
                  : 'border-white/[0.06] bg-white/[0.02] text-slate-200 hover:border-white/20'
              }`}
            >
              <div>
                <div className="text-sm font-medium">{p.name}</div>
                {p.description && <div className="text-xs text-slate-500">{p.description}</div>}
              </div>
              {presetId === p.id && <Icon name="check" size={16} className="text-accent-cyan" />}
            </button>
          ))}
        </div>
      </Modal>

      {/* Compare modal */}
      <Modal open={showCompare} onClose={() => setShowCompare(false)} title="参数对比" wide>
        <CompareTable experiment={experiment} config={config} />
      </Modal>

      {/* Export modal */}
      <Modal open={showExport} onClose={() => setShowExport(false)} title="导出配置">
        <textarea
          value={exportJson}
          onChange={(e) => setExportJson(e.target.value)}
          className="input-base h-64 font-mono text-xs"
          spellCheck={false}
        />
        <div className="mt-3 flex gap-2">
          <button onClick={handleDownload} className="btn-primary">
            <Icon name="download" size={15} /> Download JSON
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(exportJson)
              toast('已复制到剪贴板')
            }}
            className="btn-ghost"
          >
            <Icon name="copy" size={15} /> Copy
          </button>
        </div>
      </Modal>
    </div>
  )
}

function CanvasFallback() {
  return (
    <div className="grid-bg flex h-full w-full items-center justify-center bg-ink-950">
      <span className="animate-pulse-soft text-sm text-slate-600">Loading renderer…</span>
    </div>
  )
}

function CompareTable({ experiment, config }: { experiment: NonNullable<ReturnType<typeof getExperiment>>; config: ExperimentConfig }) {
  const saved = configService.getForExperiment(experiment.id)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] text-xs text-slate-400">
            <th className="py-2 pr-4">参数</th>
            <th className="py-2 pr-4">当前值</th>
            <th className="py-2 pr-4">默认值</th>
            <th className="py-2">已保存</th>
          </tr>
        </thead>
        <tbody>
          {experiment.parameterSchema.map((p) => {
            const cur = config[p.id]
            const def = experiment.defaultConfig[p.id]
            const savedV = saved?.config[p.id]
            const curStr = typeof cur === 'object' ? JSON.stringify(cur) : String(cur)
            const defStr = typeof def === 'object' ? JSON.stringify(def) : String(def)
            const savedStr = savedV === undefined ? '—' : typeof savedV === 'object' ? JSON.stringify(savedV) : String(savedV)
            const isMod = curStr !== defStr
            return (
              <tr key={p.id} className="border-b border-white/[0.04]">
                <td className="py-2 pr-4 text-slate-300">{p.label}</td>
                <td className={`py-2 pr-4 font-mono text-xs ${isMod ? 'text-accent-cyan' : 'text-slate-400'}`}>{curStr}</td>
                <td className="py-2 pr-4 font-mono text-xs text-slate-500">{defStr}</td>
                <td className="py-2 font-mono text-xs text-slate-500">{savedStr}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
