import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getExperiment, listExperiments } from '@/experiments/registry/registry'
import { normalizeConfig } from '@/engine/parameter-engine/parameterEngine'
import { configService } from '@/services/configService'
import { promptService } from '@/services/promptService'
import { usePromptStore } from '@/stores/promptStore'
import { generatePrompt } from '@/features/prompt-generator/promptEngine'
import { toast } from '@/components/common/Toast'
import { downloadText } from '@/utils/download'
import { Icon } from '@/components/common/Icon'
import { ExperimentCard } from '@/components/cards/ExperimentCard'
import type { PromptGenerationMode, PromptGeneratorOptions, TargetTool } from '@/types/prompt'

const DEFAULT_OPTIONS: PromptGeneratorOptions = {
  targetTool: 'generic',
  techStack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
  visualStyle: '深色创意科技风',
  developmentComplexity: 'advanced',
  interactionComplexity: 'moderate',
  responsive: true,
  performance: 'balanced',
  includeProjectStructure: true,
  includeRunInstructions: true,
  includeAcceptanceCriteria: true,
}

const MODES: { id: PromptGenerationMode; label: string; desc: string }[] = [
  { id: 'from-config', label: '基于当前配置', desc: '读取当前全部配置与交互行为写入提示词（默认）。' },
  { id: 'full', label: '完整重新生成', desc: '重新组织全部内容，不依赖历史提示词。' },
  { id: 'enhance', label: '增强效果', desc: '保留核心设计，提高视觉、动画、材质与细节。' },
  { id: 'directed', label: '指定方向修改', desc: '结合你的额外要求进行针对性重生成。' },
]

const TOOLS: { id: TargetTool; label: string }[] = [
  { id: 'codex', label: 'OpenAI Codex' },
  { id: 'claude-code', label: 'Claude Code' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'gemini', label: 'Google Gemini' },
  { id: 'generic', label: '通用 AI 编程助手' },
]

export default function PromptGenerator() {
  const { experimentId } = useParams()
  const [searchParams] = useSearchParams()
  const editingPromptId = searchParams.get('promptId')

  const experiment = experimentId ? getExperiment(experimentId) : undefined

  const [mode, setMode] = useState<PromptGenerationMode>('from-config')
  const [options, setOptions] = useState<PromptGeneratorOptions>(DEFAULT_OPTIONS)
  const [instruction, setInstruction] = useState('')
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('3D 效果')
  const [generating, setGenerating] = useState(false)
  const [versions, setVersions] = useState<ReturnType<typeof promptService.versions>>([])

  // load config from seed/saved/default
  const config = useMemo(() => {
    if (!experiment) return {}
    const saved = configService.getForExperiment(experiment.id)
    return normalizeConfig(experiment, saved?.config)
  }, [experiment])

  // if editing an existing prompt, prefill
  useEffect(() => {
    if (editingPromptId) {
      const p = promptService.get(editingPromptId)
      if (p) {
        setContent(p.content)
        setTitle(p.title)
        setCategory(p.category)
        setMode(p.generationMode)
        setVersions(promptService.versions(p.id))
      }
    }
  }, [editingPromptId])

  if (!experiment) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold text-white">提示词生成器</h1>
        <p className="mt-2 text-sm text-slate-400">选择一个实验，基于它的当前配置生成结构化 AI 编程提示词。</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {listExperiments().map((exp, i) => (
            <ExperimentCard key={exp.id} experiment={exp} index={i} />
          ))}
        </div>
      </div>
    )
  }

  function runGenerate() {
    setGenerating(true)
    // local template engine — instant but with a short transition for feedback
    setTimeout(() => {
      const out = generatePrompt({
        definition: experiment!,
        config,
        defaultConfig: experiment!.defaultConfig,
        mode,
        userInstruction: instruction,
        options,
      })
      setContent(out)
      if (!title) setTitle(`${experiment!.name} — AI 提示词`)
      setGenerating(false)
    }, 280)
  }

  function handleSave() {
    if (!content.trim()) {
      toast('请先生成提示词', 'error')
      return
    }
    if (editingPromptId) {
      const p = promptService.get(editingPromptId)
      if (p) {
        promptService.saveNewVersion(editingPromptId, {
          content,
          generationMode: mode,
          userInstruction: instruction || undefined,
          sourceConfigSnapshot: config,
        })
        usePromptStore.getState().refresh()
        setVersions(promptService.versions(editingPromptId))
        toast('已保存为新版本')
        return
      }
    }
    const created = promptService.create({
      title: title.trim() || `${experiment!.name} — AI 提示词`,
      description: `${experiment!.name} 的 AI 编程提示词（${mode}）`,
      category,
      content,
      sourceExperimentId: experiment!.id,
      generationMode: mode,
      targetTool: options.targetTool,
      tags: [...experiment!.tags, options.targetTool],
      userInstruction: instruction || undefined,
      sourceConfigSnapshot: config,
    })
    usePromptStore.getState().refresh()
    toast('已保存到提示词库')
    // navigate to the new prompt detail
    window.history.replaceState(null, '', `/prompts/${created.id}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Link to={`/explore/${experiment.id}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white">
            <Icon name="arrow-left" size={13} /> {experiment.name}
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-white">提示词生成器</h1>
          <p className="mt-1 text-xs text-slate-500">
            <span className="rounded border border-accent-cyan/30 bg-accent-cyan/10 px-1.5 py-0.5 text-[10px] text-accent-cyan">
              本地模板引擎
            </span>{' '}
            未接入真实 AI 时使用本地结构化模板生成，可完全离线使用。
          </p>
        </div>
        {editingPromptId && (
          <Link to="/prompts" className="btn-ghost">
            <Icon name="sparkles" size={15} /> Prompt Library
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left: settings */}
        <div className="space-y-4">
          <div className="card-surface p-5">
            <div className="panel-title">生成模式</div>
            <div className="mt-3 space-y-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    mode === m.id ? 'border-accent/50 bg-accent/10' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <div className="text-sm font-medium text-white">{m.label}</div>
                  <div className="text-xs text-slate-500">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {mode === 'directed' && (
            <div className="card-surface p-5">
              <label className="panel-title">你的要求</label>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="例如：将当前卡片改为紫色全息玻璃风格，并增加鼠标拖动旋转。"
                className="input-base mt-3 h-24 resize-none"
              />
            </div>
          )}

          <div className="card-surface p-5">
            <div className="panel-title">生成设置</div>
            <div className="mt-3 space-y-3">
              <Field label="目标工具">
                <select
                  value={options.targetTool}
                  onChange={(e) => setOptions({ ...options, targetTool: e.target.value as TargetTool })}
                  className="input-base cursor-pointer"
                >
                  {TOOLS.map((t) => (
                    <option key={t.id} value={t.id} className="bg-ink-800">{t.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="视觉风格">
                <input
                  value={options.visualStyle}
                  onChange={(e) => setOptions({ ...options, visualStyle: e.target.value })}
                  className="input-base"
                />
              </Field>
              <Field label="性能要求">
                <select
                  value={options.performance}
                  onChange={(e) => setOptions({ ...options, performance: e.target.value as PromptGeneratorOptions['performance'] })}
                  className="input-base cursor-pointer"
                >
                  <option value="basic" className="bg-ink-800">基础</option>
                  <option value="balanced" className="bg-ink-800">平衡</option>
                  <option value="optimized" className="bg-ink-800">高性能优先</option>
                </select>
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Toggle
                  label="项目结构"
                  checked={options.includeProjectStructure}
                  onChange={(v) => setOptions({ ...options, includeProjectStructure: v })}
                />
                <Toggle
                  label="运行说明"
                  checked={options.includeRunInstructions}
                  onChange={(v) => setOptions({ ...options, includeRunInstructions: v })}
                />
                <Toggle
                  label="验收标准"
                  checked={options.includeAcceptanceCriteria}
                  onChange={(v) => setOptions({ ...options, includeAcceptanceCriteria: v })}
                />
              </div>
            </div>
          </div>

          <button onClick={runGenerate} disabled={generating} className="btn-primary w-full">
            <Icon name={generating ? 'refresh' : 'sparkles'} size={16} className={generating ? 'animate-spin' : ''} />
            {generating ? '生成中…' : editingPromptId ? '重新生成' : '生成提示词'}
          </button>
        </div>

        {/* Right: editor + versions */}
        <div className="space-y-4">
          <div className="card-surface flex flex-col p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="提示词标题"
                className="w-full max-w-md border-none bg-transparent text-lg font-semibold text-white outline-none placeholder:text-slate-600"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-base w-36 cursor-pointer"
              >
                {['3D 效果', 'CSS 动画', 'GSAP 动画', 'Three.js', 'WebGL / Shader', '鼠标交互', '滚动交互', '粒子效果', '数据可视化', '创意 UI', '自定义'].map((c) => (
                  <option key={c} value={c} className="bg-ink-800">{c}</option>
                ))}
              </select>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="点击「生成提示词」后，结构化提示词会显示在这里，可直接编辑。"
              className="input-base mt-4 min-h-[420px] flex-1 resize-none font-mono text-[13px] leading-relaxed"
              spellCheck={false}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500">{content.length} chars · {content.split('\n').length} lines</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(content)
                    toast('已复制提示词')
                  }}
                  className="btn-ghost !py-1.5 text-xs"
                >
                  <Icon name="copy" size={14} /> Copy
                </button>
                <button
                  onClick={() => downloadText(`${title || 'prompt'}.md`, content, 'text/markdown')}
                  className="btn-ghost !py-1.5 text-xs"
                >
                  <Icon name="download" size={14} /> Download .md
                </button>
                <button onClick={handleSave} className="btn-primary !py-1.5 text-xs">
                  <Icon name="save" size={14} /> {editingPromptId ? '保存为新版本' : '保存到提示词库'}
                </button>
              </div>
            </div>
          </div>

          {editingPromptId && versions.length > 0 && (
            <div className="card-surface p-5">
              <div className="panel-title">版本历史</div>
              <div className="mt-3 space-y-2">
                {[...versions].reverse().map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <div>
                      <div className="text-sm font-medium text-slate-200">V{v.versionNumber}</div>
                      <div className="text-xs text-slate-500">
                        {v.generationMode} · {new Date(v.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setContent(v.content)
                        toast(`已载入 V${v.versionNumber}（保存以应用）`, 'info')
                      }}
                      className="btn-ghost !px-2.5 !py-1 text-xs"
                    >
                      载入
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
        checked ? 'border-accent/50 bg-accent/10 text-white' : 'border-white/[0.06] text-slate-400'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${checked ? 'bg-accent-cyan' : 'bg-slate-600'}`} />
      {label}
    </button>
  )
}
