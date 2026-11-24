import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePromptStore } from '@/stores/promptStore'
import { promptService } from '@/services/promptService'
import { toast } from '@/components/common/Toast'
import { timeAgo } from '@/utils/format'
import { Icon } from '@/components/common/Icon'
import type { Prompt } from '@/types/prompt'

const CATEGORIES = ['全部', '3D 效果', 'CSS 动画', 'GSAP 动画', 'Three.js', 'WebGL / Shader', '鼠标交互', '滚动交互', '粒子效果', '数据可视化', '创意 UI', '自定义']

export default function PromptLibrary() {
  const prompts = usePromptStore((s) => s.prompts)
  const refresh = usePromptStore((s) => s.refresh)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [favOnly, setFavOnly] = useState(false)

  const results = useMemo(() => {
    let list = prompts
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)))
    if (category !== '全部') list = list.filter((p) => p.category === category)
    if (favOnly) list = list.filter((p) => p.favorite)
    return list
  }, [prompts, query, category, favOnly])

  function handleDelete(id: string) {
    if (confirm('删除此提示词及其所有版本？此操作不可撤销。')) {
      promptService.remove(id)
      refresh()
      toast('已删除提示词', 'info')
    }
  }

  function handleToggleFav(id: string) {
    promptService.toggleFavorite(id)
    refresh()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">提示词库</h1>
          <p className="mt-2 text-sm text-slate-400">集中管理生成与保存的 AI 编程提示词。</p>
        </div>
        <Link to="/prompt-generator" className="btn-primary shrink-0">
          <Icon name="plus" size={15} /> New Prompt
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="relative">
          <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索标题、内容或标签…"
            className="input-base py-2.5 pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`chip !px-3 !py-1 !text-xs ${category === c ? '!border-accent/50 !bg-accent/15 !text-white' : 'hover:text-white'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFavOnly((v) => !v)}
            className={`ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${favOnly ? 'border-accent-pink/50 bg-accent-pink/10 text-accent-pink' : 'border-white/10 text-slate-400'}`}
          >
            <Icon name={favOnly ? 'heart-filled' : 'heart'} size={13} /> Favorites
          </button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Icon name="sparkles" size={32} className="text-slate-600" />
          <p className="mt-4 text-sm text-slate-400">
            {prompts.length === 0 ? '还没有提示词。生成你的第一条提示词吧。' : '没有匹配的提示词。'}
          </p>
          {prompts.length === 0 && (
            <Link to="/explore" className="btn-primary mt-5">
              <Icon name="flask" size={15} /> Choose an experiment
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((p) => (
            <PromptCard key={p.id} prompt={p} onDelete={handleDelete} onToggleFav={handleToggleFav} />
          ))}
        </div>
      )}
    </div>
  )
}

function PromptCard({
  prompt,
  onDelete,
  onToggleFav,
}: {
  prompt: Prompt
  onDelete: (id: string) => void
  onToggleFav: (id: string) => void
}) {
  return (
    <div className="group card-surface flex flex-col p-5 transition-all hover:border-accent/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="chip !text-[10px]">{prompt.category}</span>
            <span className="text-[10px] text-slate-600">V{prompt.currentVersion}</span>
          </div>
          <Link to={`/prompts/${prompt.id}`} className="mt-2 block truncate text-[15px] font-semibold text-white hover:text-accent-cyan">
            {prompt.title}
          </Link>
        </div>
        <button
          onClick={() => onToggleFav(prompt.id)}
          className={`shrink-0 rounded-lg p-1.5 ${prompt.favorite ? 'text-accent-pink' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Icon name={prompt.favorite ? 'heart-filled' : 'heart'} size={16} />
        </button>
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-slate-400">
        {prompt.description || prompt.content.slice(0, 120)}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {prompt.tags.slice(0, 3).map((t) => (
          <span key={t} className="chip !text-[10px]">{t}</span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-slate-500">
        <span>updated {timeAgo(prompt.updatedAt)}</span>
        <div className="flex gap-1">
          <Link to={`/prompts/${prompt.id}`} className="rounded-md p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white">
            <Icon name="eye" size={14} />
          </Link>
          <Link to={`/prompt-generator/${prompt.sourceExperimentId ?? ''}?promptId=${prompt.id}`} className="rounded-md p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white">
            <Icon name="refresh" size={14} />
          </Link>
          <button onClick={() => onDelete(prompt.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300">
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
