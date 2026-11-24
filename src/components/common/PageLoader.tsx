export function PageLoader({ full = false }: { full?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${full ? 'h-screen' : 'min-h-[60vh]'}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        <span className="text-xs text-slate-500">Loading…</span>
      </div>
    </div>
  )
}
