import { Link } from 'react-router-dom'
import { usePreferencesStore, type QualityLevel } from '@/stores/preferencesStore'
import { useWorkStore } from '@/stores/workStore'
import { usePromptStore } from '@/stores/promptStore'
import { useRemixStore } from '@/stores/remixStore'
import { useExperimentStore } from '@/stores/experimentStore'
import { storageService } from '@/services/storageService'
import { getExperiment } from '@/experiments/registry/registry'
import { toast } from '@/components/common/Toast'
import { Icon } from '@/components/common/Icon'

const QUALITY: { id: QualityLevel; label: string; desc: string }[] = [
  { id: 'high', label: '高', desc: '最高渲染质量（默认）' },
  { id: 'medium', label: '中', desc: '平衡质量与性能' },
  { id: 'low', label: '低', desc: '降低 DPR 与粒子数量，适合低性能设备' },
]

export default function Settings() {
  const prefs = usePreferencesStore()
  const refreshWork = useWorkStore((s) => s.refresh)
  const refreshPrompt = usePromptStore((s) => s.refresh)
  const refreshRemix = useRemixStore((s) => s.refresh)
  const refreshExp = useExperimentStore((s) => s.refresh)

  function clearCollection(name: string, label: string) {
    if (confirm(`清除全部「${label}」数据？此操作不可撤销。`)) {
      storageService.clearCollection(name)
      refreshWork()
      refreshPrompt()
      refreshRemix()
      refreshExp()
      toast(`已清除${label}`, 'info')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-white">设置</h1>
      <p className="mt-2 text-sm text-slate-400">偏好、收藏与本地数据管理。</p>

      {/* preferences */}
      <section className="card-surface mt-8 p-6">
        <h2 className="text-lg font-semibold text-white">偏好</h2>
        <div className="mt-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-200">减少动态效果</div>
              <div className="text-xs text-slate-500">关闭背景动画与高帧率循环，降低 GPU 占用。</div>
            </div>
            <button
              role="switch"
              aria-checked={prefs.reduceMotion}
              onClick={prefs.toggleReduceMotion}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${prefs.reduceMotion ? 'bg-accent' : 'bg-white/10'}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${prefs.reduceMotion ? 'translate-x-[20px]' : 'translate-x-0'}`} />
            </button>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-slate-200">渲染质量</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {QUALITY.map((q) => (
                <button
                  key={q.id}
                  onClick={() => prefs.setQuality(q.id)}
                  className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                    prefs.quality === q.id ? 'border-accent/50 bg-accent/10' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <div className="text-sm font-medium text-white">{q.label}</div>
                  <div className="text-xs text-slate-500">{q.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* favorites */}
      <section className="card-surface mt-6 p-6">
        <h2 className="text-lg font-semibold text-white">收藏的实验（{prefs.favoriteExperiments.length}）</h2>
        {prefs.favoriteExperiments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">还没有收藏任何实验。</p>
        ) : (
          <div className="mt-4 space-y-2">
            {prefs.favoriteExperiments.map((id) => {
              const exp = getExperiment(id)
              if (!exp) return null
              return (
                <div key={id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <Link to={`/explore/${id}`} className="truncate text-sm font-medium text-white hover:text-accent-cyan">{exp.name}</Link>
                  <button onClick={() => prefs.toggleFavoriteExperiment(id)} className="text-accent-pink">
                    <Icon name="heart-filled" size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* data management */}
      <section className="card-surface mt-6 p-6">
        <h2 className="text-lg font-semibold text-white">数据管理</h2>
        <p className="mt-1 text-xs text-slate-500">数据存储于本机（localStorage + IndexedDB），本地优先，不会上传。</p>
        <div className="mt-5 space-y-3">
          <DataRow label="已保存配置" onClear={() => clearCollection('savedConfig', '已保存配置')} />
          <DataRow label="作品" onClear={() => clearCollection('work', '作品')} />
          <DataRow label="提示词" onClear={() => { clearCollection('prompt', '提示词'); clearCollection('promptVersion', '提示词版本') }} />
          <DataRow label="Remix" onClear={() => { clearCollection('remix', 'Remix'); clearCollection('remixVersion', 'Remix 版本') }} />
          <DataRow
            label="全部数据（含偏好）"
            danger
            onClear={() => {
              if (confirm('清除全部本地数据？包括作品、提示词、Remix 与偏好。')) {
                ;['savedConfig', 'work', 'prompt', 'promptVersion', 'remix', 'remixVersion', 'pref'].forEach((c) => storageService.clearCollection(c))
                prefs.reset()
                refreshWork()
                refreshPrompt()
                refreshRemix()
                refreshExp()
                toast('已清除全部数据', 'info')
              }
            }}
          />
        </div>
      </section>

      {/* about */}
      <section className="card-surface mt-6 p-6">
        <h2 className="text-lg font-semibold text-white">关于</h2>
        <p className="mt-2 text-sm text-slate-400">
          Creative Playground — 交互式视觉实验与 AI 创作平台。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['React 18', 'TypeScript', 'Vite', 'Three.js', 'GSAP', 'Framer Motion', 'Zustand', 'Tailwind CSS'].map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
      </section>
    </div>
  )
}

function DataRow({ label, onClear, danger = false }: { label: string; onClear: () => void; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <span className="text-sm text-slate-200">{label}</span>
      <button onClick={onClear} className={danger ? 'btn-danger !px-3 !py-1.5 text-xs' : 'btn-ghost !px-3 !py-1.5 text-xs'}>
        <Icon name="trash" size={13} /> Clear
      </button>
    </div>
  )
}
