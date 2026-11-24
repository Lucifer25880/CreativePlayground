import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ConfigValue, ExperimentConfig, ParameterSchema } from '@/types/config'
import { ParamControl } from './ParamControl'
import { Icon } from '@/components/common/Icon'

interface ControlPanelProps {
  schema: ParameterSchema
  config: ExperimentConfig
  onChange: (id: string, value: ConfigValue) => void
  /** ids of params whose value differs from defaults (highlighted) */
  modifiedIds?: Set<string>
  searchable?: boolean
}

interface Group {
  name: string
  params: ParameterSchema
}

export function ControlPanel({
  schema,
  config,
  onChange,
  modifiedIds,
  searchable = true,
}: ControlPanelProps) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const groups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase()
    const map = new Map<string, ParameterSchema>()
    for (const p of schema) {
      if (q) {
        const hay = `${p.label} ${p.id} ${p.description ?? ''}`.toLowerCase()
        if (!hay.includes(q)) continue
      }
      const g = p.group || 'General'
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(p)
    }
    return [...map.entries()].map(([name, params]) => ({ name, params }))
  }, [schema, query])

  function toggle(name: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col">
      {searchable && (
        <div className="relative mb-3">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parameters…"
            className="input-base pl-9"
          />
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {groups.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">No parameters match “{query}”.</p>
        )}
        {groups.map((group) => {
          const isCollapsed = collapsed.has(group.name)
          return (
            <div key={group.name} className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <button
                onClick={() => toggle(group.name)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left"
              >
                <span className="panel-title">{group.name}</span>
                <Icon
                  name="chevron-down"
                  size={14}
                  className={`text-slate-500 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 px-3 pb-3 pt-1">
                      {group.params.map((p) => (
                        <div key={p.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-300">
                              {p.label}
                              {modifiedIds?.has(p.id) && (
                                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent-cyan align-middle" />
                              )}
                            </label>
                            {p.advanced && (
                              <span className="text-[9px] uppercase tracking-wide text-slate-600">adv</span>
                            )}
                          </div>
                          <ParamControl
                            param={p}
                            value={config[p.id] as never}
                            onChange={(v) => onChange(p.id, v)}
                          />
                          {p.description && (
                            <p className="text-[10px] leading-snug text-slate-500">{p.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
