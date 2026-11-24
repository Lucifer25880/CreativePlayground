import { Link } from 'react-router-dom'

const COLUMNS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Explore', to: '/explore' },
      { label: 'Playground', to: '/playground' },
      { label: 'Creative Studio', to: '/studio' },
    ],
  },
  {
    title: 'Create',
    links: [
      { label: 'Prompt Library', to: '/prompts' },
      { label: 'My Works', to: '/works' },
      { label: 'Settings', to: '/settings' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.06] bg-ink-950/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="text-lg font-semibold text-white">
            Creative <span className="text-gradient">Playground</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            An interactive visual experiment and AI creation platform. Explore, experiment,
            remix, generate prompts and save your own works.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {['React', 'TypeScript', 'Three.js', 'GSAP', 'Zustand'].map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="panel-title">{col.title}</div>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.06] py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Creative Playground. Built for creators.</span>
          <span>Explore → Experiment → Remix → Generate → Save</span>
        </div>
      </div>
    </footer>
  )
}
