import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { promptService } from '@/services/promptService'
import { remixService } from '@/services/remixService'
import { getExperiment } from '@/experiments/registry/registry'
import { usePromptStore } from '@/stores/promptStore'
import { useRemixStore } from '@/stores/remixStore'
import { MarkdownView } from '@/components/common/MarkdownView'
import { Modal } from '@/components/common/Modal'
import { toast } from '@/components/common/Toast'
import { downloadText } from '@/utils/download'
import { diffLines } from '@/utils/diff'
import { timeAgo } from '@/utils/format'
import { Icon } from '@/components/common/Icon'
import { useBack } from '@/hooks/useBack'

const MODE_LABEL: Record<string, string> = {
  full: '完整重新生成',
  'from-config': '基于当前配置',
  enhance: '增强效果',
  directed: '指定方向修改',
}

export default function PromptDetail() {
  const { promptId } = useParams()
  const navigate = useNavigate()
  const back = useBack('/prompts')
  const refresh = usePromptStore((s) => s.refresh)
  const [prompt, setPrompt] = useState(() => (promptId ? promptService.get(promptId) : null))
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null)

  const versions = useMemo(() => (prompt ? promptService.versions(prompt.id) : []), [prompt])

  if (!prompt) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-slate-400">Prompt not found.</p>
        <Link to="/prompts" className="btn-ghost">Back to Prompt Library</Link>
      </div>
    )
  }

  const experiment = prompt.sourceExperimentId ? getExperiment(prompt.sourceExperimentId) : undefined
  const compareVersion = versions.find((v) => v.id === compareVersionId)
  const diff = compareVersion ? diffLines(compareVersion.content, prompt.content) : null

  function reload() {
    setPrompt(promptId ? promptService.get(promptId) : null)
    refresh()
  }

  function handleToggleFav() {
    promptService.toggleFavorite(prompt!.id)
    reload()
  }

  function handleDelete() {
    if (confirm('删除此提示词及其所有版本？')) {
      promptService.remove(prompt!.id)
      refresh()
      navigate('/prompts')
    }
  }

  function handleSaveEdit() {
    promptService.update(prompt!.id, { content: draft, updatedAt: new Date().toISOString() })
    setEditing(false)
    reload()
    toast('已保存修改')
  }

  function handleRestoreVersion(versionId: string) {
    const v = versions.find((x) => x.id === versionId)
    if (!v) return
    promptService.saveNewVersion(prompt!.id, {
      content: v.content,
      generationMode: v.generationMode,
      userInstruction: v.userInstruction,
      sourceConfigSnapshot: v.sourceConfigSnapshot,
    })
    reload()
    toast(`已基于 V${v.versionNumber} 创建新版本`, 'success')
  }

  function handleRemixFromPrompt() {
    const snapshot = versions.find((v) => v.sourceConfigSnapshot)?.sourceConfigSnapshot
    if (!experiment) return
    const remix = remixService.create({
      title: `${prompt!.title} — Remix`,
      sourceExperimentId: experiment.id,
      config: snapshot ?? experiment.defaultConfig,
    })
    useRemixStore.getState().refresh()
    navigate(`/studio/remix/${remix.id}`)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <button
        onClick={back}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <Icon name="arrow-left" size={15} /> Back
      </button>

      <div className="mt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip !text-[11px]">{prompt.category}</span>
              <span className="chip !text-[11px]">V{prompt.currentVersion}</span>
              <span className="chip !text-[11px] text-accent-cyan">{MODE_LABEL[prompt.generationMode] ?? prompt.generationMode}</span>
              <span className="chip !text-[11px]">{prompt.targetTool}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{prompt.title}</h1>
            {prompt.description && <p className="mt-1 text-sm text-slate-400">{prompt.description}</p>}
            <p className="mt-1 text-xs text-slate-500">
              created {timeAgo(prompt.createdAt)} · updated {timeAgo(prompt.updatedAt)}
            </p>
          </div>
          <button
            onClick={handleToggleFav}
            className={`rounded-xl border border-white/10 p-2.5 ${prompt.favorite ? 'text-accent-pink' : 'text-slate-400'}`}
          >
            <Icon name={prompt.favorite ? 'heart-filled' : 'heart'} size={18} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(prompt.content)
              toast('已复制提示词')
            }}
            className="btn-ghost !py-1.5 text-xs"
          >
            <Icon name="copy" size={14} /> Copy
          </button>
          <button onClick={() => downloadText(`${prompt.title}.md`, prompt.content, 'text/markdown')} className="btn-ghost !py-1.5 text-xs">
            <Icon name="download" size={14} /> Download .md
          </button>
          <button
            onClick={() => {
              setDraft(prompt.content)
              setEditing((v) => !v)
            }}
            className="btn-ghost !py-1.5 text-xs"
          >
            <Icon name="edit" size={14} /> {editing ? 'Cancel' : 'Edit'}
          </button>
          <Link to={`/prompt-generator/${prompt.sourceExperimentId ?? ''}?promptId=${prompt.id}`} className="btn-ghost !py-1.5 text-xs">
            <Icon name="refresh" size={14} /> Regenerate
          </Link>
          {experiment && (
            <button onClick={handleRemixFromPrompt} className="btn-ghost !py-1.5 text-xs">
              <Icon name="wand" size={14} /> Create Remix
            </button>
          )}
          <button onClick={handleDelete} className="btn-danger !py-1.5 text-xs ml-auto">
            <Icon name="trash" size={14} /> Delete
          </button>
        </div>

        {experiment && (
          <Link to={`/explore/${experiment.id}`} className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent-cyan hover:text-white">
            <Icon name="flask" size={13} /> 来源实验：{experiment.name}
          </Link>
        )}
      </div>

      {/* content */}
      <div className="card-surface mt-6 p-6">
        {editing ? (
          <div>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="input-base min-h-[480px] font-mono text-[13px]" spellCheck={false} />
            <div className="mt-3 flex gap-2">
              <button onClick={handleSaveEdit} className="btn-primary"><Icon name="save" size={15} /> Save</button>
              <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        ) : (
          <MarkdownView content={prompt.content} />
        )}
      </div>

      {/* versions */}
      <div className="card-surface mt-6 p-6">
        <div className="flex items-center justify-between">
          <div className="panel-title">版本历史（{versions.length}）</div>
          {compareVersionId && (
            <button onClick={() => setCompareVersionId(null)} className="text-xs text-accent-cyan hover:text-white">
              Clear comparison
            </button>
          )}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...versions].reverse().map((v) => (
            <div
              key={v.id}
              className={`rounded-xl border px-3 py-2.5 ${compareVersionId === v.id ? 'border-accent/50 bg-accent/10' : 'border-white/[0.06] bg-white/[0.02]'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">V{v.versionNumber}</span>
                <span className="text-[10px] text-slate-500">{MODE_LABEL[v.generationMode] ?? v.generationMode}</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">{new Date(v.createdAt).toLocaleString()}</div>
              {v.userInstruction && <div className="mt-1 truncate text-[11px] text-slate-400">“{v.userInstruction}”</div>}
              <div className="mt-2 flex gap-1.5">
                <button onClick={() => setCompareVersionId(v.id)} className="btn-ghost !px-2 !py-1 !text-[11px]">
                  <Icon name="compare" size={12} /> Compare
                </button>
                <button onClick={() => handleRestoreVersion(v.id)} className="btn-ghost !px-2 !py-1 !text-[11px]">
                  <Icon name="reset" size={12} /> Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* diff modal */}
      <Modal open={!!diff} onClose={() => setCompareVersionId(null)} title={`版本差异（V${compareVersion?.versionNumber} → 当前）`} wide>
        {diff && (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-ink-950 p-3 font-mono text-xs leading-relaxed">
            {diff.map((l, idx) => (
              <div
                key={idx}
                className={`whitespace-pre-wrap px-2 ${
                  l.type === 'add'
                    ? 'bg-accent-lime/10 text-accent-lime'
                    : l.type === 'del'
                      ? 'bg-rose-500/10 text-rose-300'
                      : 'text-slate-400'
                }`}
              >
                <span className="mr-2 select-none opacity-50">{l.type === 'add' ? '+' : l.type === 'del' ? '-' : ' '}</span>
                {l.text || ' '}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
