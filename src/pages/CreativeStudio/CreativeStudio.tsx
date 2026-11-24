import { Link } from 'react-router-dom'
import { useRemixStore } from '@/stores/remixStore'
import { useWorkStore } from '@/stores/workStore'
import { remixService } from '@/services/remixService'
import { getExperiment } from '@/experiments/registry/registry'
import { toast } from '@/components/common/Toast'
import { timeAgo } from '@/utils/format'
import { Icon, type IconName } from '@/components/common/Icon'

const TOOLS: { icon: IconName; title: string; desc: string; to: string; cta: string }[] = [
  { icon: 'wand', title: 'Remix Studio', desc: '复制实验配置，二次创作为独立作品。', to: '/explore', cta: 'New Remix' },
  { icon: 'sparkles', title: 'Prompt Generator', desc: '从当前实验生成结构化 AI 提示词。', to: '/prompt-generator', cta: 'Generate' },
  { icon: 'folder', title: 'My Works', desc: '管理你的作品、配置与版本。', to: '/works', cta: 'View Works' },
]

export default function CreativeStudio() {
  const remixes = useRemixStore((s) => s.remixes)
  const works = useWorkStore((s) => s.works)
  const refreshRemix = useRemixStore((s) => s.refresh)

  function handleDelete(id: string) {
    if (confirm('删除此 Remix 及其版本？')) {
      remixService.remove(id)
      refreshRemix()
      toast('已删除 Remix', 'info')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-white">创作工作室</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        把实验结果沉淀为可长期管理和复用的作品：二次创作、生成提示词、保存版本。
      </p>

      {/* tool cards */}
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {TOOLS.map((t) => (
          <Link key={t.title} to={t.to} className="card-surface group p-6 transition-all hover:border-accent/40">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-accent/20 to-accent-cyan/20 text-accent-cyan">
              <Icon name={t.icon} size={20} />
            </span>
            <h3 className="mt-4 text-base font-semibold text-white">{t.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{t.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm text-accent-cyan group-hover:text-white">
              {t.cta} <Icon name="arrow-right" size={14} />
            </span>
          </Link>
        ))}
      </div>

      {/* remixes */}
      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">我的 Remix（{remixes.length}）</h2>
          <Link to="/explore" className="flex items-center gap-1 text-sm text-accent-cyan hover:text-white">
            <Icon name="plus" size={15} /> New Remix
          </Link>
        </div>

        {remixes.length === 0 ? (
          <div className="card-surface mt-5 flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Icon name="wand" size={30} className="text-slate-600" />
            <p className="text-sm text-slate-400">还没有 Remix。从任意实验点击「Remix」开始二次创作。</p>
            <Link to="/explore" className="btn-primary mt-2"><Icon name="compass" size={15} /> Browse Experiments</Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {remixes.map((r) => {
              const exp = getExperiment(r.sourceExperimentId)
              return (
                <div key={r.id} className="card-surface p-5">
                  <div className="flex items-center justify-between">
                    <span className="chip !text-[10px]">V{r.currentVersion}</span>
                    <span className="text-[11px] text-slate-500">updated {timeAgo(r.updatedAt)}</span>
                  </div>
                  <Link to={`/studio/remix/${r.id}`} className="mt-2 block truncate text-[15px] font-semibold text-white hover:text-accent-cyan">
                    {r.title}
                  </Link>
                  <div className="mt-1 truncate text-xs text-slate-500">来源：{exp?.name ?? r.sourceExperimentId}</div>
                  {r.description && <p className="mt-2 line-clamp-2 text-xs text-slate-400">{r.description}</p>}
                  <div className="mt-4 flex gap-2 border-t border-white/[0.06] pt-3">
                    <Link to={`/studio/remix/${r.id}`} className="btn-primary flex-1 !py-1.5 text-xs">
                      <Icon name="edit" size={13} /> Edit
                    </Link>
                    <button onClick={() => handleDelete(r.id)} className="btn-ghost !px-2.5 !py-1.5 text-xs">
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* recent works */}
      {works.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">近期作品（{works.length}）</h2>
            <Link to="/works" className="flex items-center gap-1 text-sm text-accent-cyan hover:text-white">
              View all <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
