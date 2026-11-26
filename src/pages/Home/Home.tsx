import { Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listExperiments, getExperiment, getExperimentComponents } from '@/experiments/registry/registry'
import { ExperimentCard } from '@/components/cards/ExperimentCard'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Icon, type IconName } from '@/components/common/Icon'
import { CosmicBackground } from '@/components/visuals/CosmicBackground'
import { ExplosionButton } from '@/components/visuals/ExplosionButton'
import { useInView } from '@/hooks/useInView'
import { useCosmicStore } from '@/stores/cosmicStore'



const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'flask', title: 'Live Playground', desc: '实时调整参数，立即看到渲染结果变化。' },
  { icon: 'wand', title: 'Remix Studio', desc: '复制实验、二次创作并保存为独立作品。' },
  { icon: 'sparkles', title: 'Prompt Generator', desc: '从当前实验自动生成结构化 AI 编程提示词。' },
  { icon: 'folder', title: 'My Works', desc: '管理、复用你的作品、提示词与版本历史。' },
]

const FLOW: { icon: IconName; label: string; desc: string }[] = [
  { icon: 'compass', label: 'Explore', desc: '探索视觉效果' },
  { icon: 'flask', label: 'Experiment', desc: '实际操作实验' },
  { icon: 'wand', label: 'Remix', desc: '二次创作' },
  { icon: 'sparkles', label: 'Generate', desc: '生成提示词' },
  { icon: 'save', label: 'Save', desc: '保存作品' },
]

export default function Home() {
  const featured = listExperiments().slice(0, 4)
  const phase = useCosmicStore((s) => s.phase)
  const [contentVisible, setContentVisible] = useState(true)
  const [flash, setFlash] = useState(false)

  // Hide the page content during explode / rewind; restore 1s after rewind finishes.
  useEffect(() => {
    if (phase === 'exploding' || phase === 'rewinding') {
      setContentVisible(false)
    } else if (phase === 'idle') {
      const t = setTimeout(() => setContentVisible(true), 1000)
      return () => clearTimeout(t)
    }
  }, [phase])

  // Brief full-screen white flash at the moment of detonation.
  useEffect(() => {
    if (phase === 'exploding') {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 90)
      return () => clearTimeout(t)
    }
  }, [phase])

  return (
    <div className="relative">
      <CosmicBackground />
      <div className={`relative z-10 transition-opacity duration-500 ${contentVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        {/* HERO */}
        <section className="relative flex min-h-[92vh] items-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(7,7,13,0.94)_0%,rgba(7,7,13,0.72)_26%,rgba(7,7,13,0.28)_48%,rgba(7,7,13,0)_66%)]" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent-cyan" />
              Interactive visual lab &amp; AI creation platform
            </div>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Creative
              <br />
              <span className="text-gradient">Playground</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Explore stunning visual experiments, operate them in real time, remix them into your
              own works, and generate production-ready AI prompts — all in one creative loop.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/explore" className="btn-primary px-6 py-3">
                <Icon name="compass" size={16} />
                Explore
              </Link>
              <Link to="/playground/3d-card-rotation" className="btn-ghost px-6 py-3">
                <Icon name="play" size={15} />
                Start Creating
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Icon name="check" size={13} className="text-accent-cyan" /> 20 interactive experiments</span>
              <span className="flex items-center gap-1.5"><Icon name="check" size={13} className="text-accent-cyan" /> Real-time parameters</span>
              <span className="flex items-center gap-1.5"><Icon name="check" size={13} className="text-accent-cyan" /> Local-first &amp; private</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <div className="relative mx-auto aspect-[4/3] max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-ink-900/60 shadow-panel">
              <div className="absolute inset-0">
                <HeroVisual hidden={!contentVisible} />
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/10 bg-ink-950/70 px-4 py-3 backdrop-blur">
                <div>
                  <div className="text-sm font-medium text-white">3D 卡片旋转</div>
                  <div className="text-[11px] text-slate-500">Three.js · React Three Fiber</div>
                </div>
                <Link to="/playground/3d-card-rotation" className="btn-primary !py-1.5 text-xs">
                  Open
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading title="精选视觉实验" subtitle="每一个都具备真实动态预览与可操作参数。" link={{ to: '/explore', label: 'View all' }} />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((exp, i) => (
            <ExperimentCard key={exp.id} experiment={exp} index={i} />
          ))}
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="border-y border-white/[0.06] bg-ink-900/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHeading title="平台核心能力" subtitle="从观看到操作，再到创作与沉淀的完整闭环。" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="card-surface p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-accent/20 to-accent-cyan/20 text-accent-cyan">
                  <Icon name={f.icon} size={20} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FLOW */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading title="创作流程" subtitle="Explore → Experiment → Remix → Generate → Save。" />
        <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {FLOW.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="relative card-surface p-5 text-center"
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-950 px-2.5 py-0.5 text-[11px] font-semibold text-accent-cyan">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="mx-auto mt-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-accent">
                <Icon name={s.icon} size={18} />
              </span>
              <div className="mt-3 text-sm font-semibold text-white">{s.label}</div>
              <div className="mt-1 text-xs text-slate-500">{s.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-accent/15 via-ink-800 to-accent-cyan/10 p-10 text-center sm:p-16">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">开始你的第一次创作</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-300">
              从一个 3D 卡片开始，调整参数，保存作品，生成你的第一条 AI 编程提示词。
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/explore" className="btn-primary px-6 py-3">Browse Experiments</Link>
              <Link to="/prompts" className="btn-ghost px-6 py-3">Open Prompt Library</Link>
            </div>
          </div>
        </div>
      </section>
      </div>
      {/* Explosion screen flash */}
      <div
        className={`pointer-events-none fixed inset-0 z-[55] bg-white transition-opacity ${
          flash ? 'opacity-50 duration-0' : 'opacity-0 duration-700'
        }`}
      />
      {/* Small icon-only detonator */}
      <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
        <ExplosionButton />
      </div>
    </div>
  )
}

function HeroVisual({ hidden }: { hidden?: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className="h-full w-full">
      {!hidden && inView ? <HeroPreview /> : null}
    </div>
  )
}

function HeroPreview() {
  const { Preview } = getPreviewFor('3d-card-rotation')
  const experiment = getExperiment('3d-card-rotation')
  if (!experiment) return null
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Preview config={experiment.defaultConfig} preview />
      </Suspense>
    </ErrorBoundary>
  )
}

function getPreviewFor(id: string) {
  const c = getExperimentComponents(id)
  if (!c) return { Preview: () => null }
  return c
}

function SectionHeading({
  title,
  subtitle,
  link,
}: {
  title: string
  subtitle?: string
  link?: { to: string; label: string }
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {link && (
        <Link to={link.to} className="flex shrink-0 items-center gap-1 text-sm text-accent-cyan hover:text-white">
          {link.label} <Icon name="arrow-right" size={14} />
        </Link>
      )}
    </div>
  )
}
