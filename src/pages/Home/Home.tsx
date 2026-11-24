import { Suspense, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listExperiments, getExperiment, getExperimentComponents } from '@/experiments/registry/registry'
import { ExperimentCard } from '@/components/cards/ExperimentCard'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Icon, type IconName } from '@/components/common/Icon'

function HeroParticles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.0004,
      vy: (Math.random() - 0.5) * 0.0004,
      hue: Math.random() > 0.5 ? 250 : 190,
    }))
    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > 1) p.vx *= -1
        if (p.y < 0 || p.y > 1) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, 0.5)`
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />
}

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

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <HeroParticles />
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-accent-cyan/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent-pink/10 blur-[120px]" />

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
                <HeroPreview />
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
