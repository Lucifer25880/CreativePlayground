import type { Difficulty, ExperimentCategoryId } from '@/types/experiment'
import { getCategory } from '@/experiments/registry/categories'

const DIFFICULTY: Record<Difficulty, { label: string; cls: string }> = {
  beginner: { label: 'Beginner', cls: 'text-accent-lime border-accent-lime/30 bg-accent-lime/10' },
  intermediate: { label: 'Intermediate', cls: 'text-accent-amber border-accent-amber/30 bg-accent-amber/10' },
  advanced: { label: 'Advanced', cls: 'text-accent-pink border-accent-pink/30 bg-accent-pink/10' },
  expert: { label: 'Expert', cls: 'text-rose-300 border-rose-400/30 bg-rose-400/10' },
}

export function DifficultyBadge({ level }: { level: Difficulty }) {
  const d = DIFFICULTY[level]
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${d.cls}`}>
      {d.label}
    </span>
  )
}

export function CategoryBadge({ category }: { category: ExperimentCategoryId }) {
  const c = getCategory(category)
  return <span className="chip text-[11px]">{c?.name ?? category}</span>
}

export function TagChip({ tag }: { tag: string }) {
  return <span className="chip">{tag}</span>
}
