import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { listExperiments, searchExperiments, experimentsByCategory } from '@/experiments/registry/registry'
import { CATEGORIES } from '@/experiments/registry/categories'
import type { ExperimentCategoryId } from '@/types/experiment'
import { ExperimentCard } from '@/components/cards/ExperimentCard'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { Icon } from '@/components/common/Icon'

type Filter = 'all' | 'favorites' | ExperimentCategoryId

export default function Explore() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const favorites = usePreferencesStore((s) => s.favoriteExperiments)

  const results = useMemo(() => {
    let list = query.trim() ? searchExperiments(query) : listExperiments()
    if (filter === 'favorites') list = list.filter((d) => favorites.includes(d.id))
    else if (filter !== 'all') list = list.filter((d) => d.category === filter)
    return list
  }, [query, filter, favorites])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of listExperiments()) map.set(d.category, (map.get(d.category) ?? 0) + 1)
    return map
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white">视觉展厅</h1>
          <p className="mt-2 text-sm text-slate-400">
            浏览 {listExperiments().length} 个交互式视觉实验，点击卡片体验真实动态预览。
          </p>
        </div>

        {/* search + favorites */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索实验名称、描述或标签…"
              className="input-base py-2.5 pl-9"
            />
          </div>
          <button
            onClick={() => setFilter(filter === 'favorites' ? 'all' : 'favorites')}
            className={`btn-ghost ${filter === 'favorites' ? '!border-accent-pink/50 !text-accent-pink' : ''}`}
          >
            <Icon name="heart-filled" size={15} />
            Favorites {favorites.length > 0 && `(${favorites.length})`}
          </button>
        </div>

        {/* category filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`chip !px-3 !py-1.5 !text-xs transition-colors ${
              filter === 'all' ? '!border-accent/50 !bg-accent/15 !text-white' : 'hover:text-white'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id as Filter)}
              className={`chip !px-3 !py-1.5 !text-xs transition-colors ${
                filter === c.id ? '!border-accent/50 !bg-accent/15 !text-white' : 'hover:text-white'
              }`}
            >
              <Icon name={c.icon as never} size={12} className="mr-1" />
              {c.name}
              <span className="ml-1 text-slate-500">{(filter === c.id ? experimentsByCategory(c.id).length : counts.get(c.id)) ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* grid */}
      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Icon name="search" size={32} className="text-slate-600" />
          <p className="mt-4 text-sm text-slate-400">没有找到匹配的实验。</p>
          <button
            onClick={() => {
              setQuery('')
              setFilter('all')
            }}
            className="btn-ghost mt-4"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <motion.div layout className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((exp, i) => (
            <ExperimentCard key={exp.id} experiment={exp} index={i} />
          ))}
        </motion.div>
      )}
    </div>
  )
}
