import { useCallback, useEffect, useRef, useState } from 'react'
import type { ExperimentModule, ExperimentComponentProps } from '@/experiments/shared/types'
import { definition } from './meta'

interface Msg {
  id: string
  role: 'user' | 'agent'
  text: string
  thinking: boolean
  toolName?: string
  toolResult?: string
  streaming: boolean
  done: boolean
}

let uid = 0
const nextId = (p: string) => `${p}-${++uid}-${Math.random().toString(36).slice(2, 7)}`

const CANNED_ANSWER =
  '我已分析你的问题：相关逻辑位于核心模块 handler.ts 中。建议从入口函数开始排查，并补充单元测试覆盖边界情况，这样可以快速定位并避免回归。'
const TOOL_RESULT = `找到 3 个相关文件
  src/core/handler.ts
  src/utils/helper.ts
  src/features/module.tsx`

const STEPS = ['思考', '工具调用', '生成', '完成']

function rgba(hex: string, alpha: number) {
  const h = (hex || '#7c6cff').replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(f.slice(0, 2), 16) || 0
  const g = parseInt(f.slice(2, 4), 16) || 0
  const b = parseInt(f.slice(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${alpha})`
}

interface Palette {
  bg: string
  panel: string
  text: string
  sub: string
  border: string
  agentBubble: string
  toolBg: string
}

function makePalette(themeKey: string, accent: string): Palette {
  if (themeKey === 'light') {
    return {
      bg: '#f5f6fb',
      panel: '#ffffff',
      text: '#1a1a28',
      sub: '#6a6a80',
      border: '#d8dae6',
      agentBubble: '#eef0f6',
      toolBg: '#f0f1f7',
    }
  }
  if (themeKey === 'accent') {
    return {
      bg: '#0a0a14',
      panel: '#12101f',
      text: '#e8e8f0',
      sub: '#9a9ab0',
      border: rgba(accent, 0.35),
      agentBubble: '#161426',
      toolBg: '#161226',
    }
  }
  return {
    bg: '#0c0c16',
    panel: '#12121f',
    text: '#e8e8f0',
    sub: '#9a9ab0',
    border: '#262637',
    agentBubble: '#1a1a2a',
    toolBg: '#14141f',
  }
}

function AiAgentUi({ config, preview }: ExperimentComponentProps) {
  const accent = config.accentColor ?? '#7c6cff'
  const themeKey = config.theme ?? 'dark'
  const pal = makePalette(themeKey, accent)
  const typingSpeed = Math.max(1, Number(config.typingSpeed) || 30)
  const responseDelay = Math.max(0, Number(config.responseDelay) || 0) * 1000
  const toolCallDuration = Math.max(0.1, Number(config.toolCallDuration) || 1.5) * 1000
  const animSpeed = Math.max(0.2, Number(config.animationSpeed) || 1)

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(0)

  const runIdRef = useRef(0)
  const mountedRef = useRef(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      runIdRef.current++
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms))

  const alive = (runId: number) => mountedRef.current && runIdRef.current === runId

  const updateAgent = (prev: Msg[], id: string, patch: Partial<Msg>): Msg[] =>
    prev.map((m) => (m.id === id ? { ...m, ...patch } : m))

  const runAgent = useCallback(
    async (userText: string) => {
      const runId = ++runIdRef.current
      const query = (userText || 'project').slice(0, 24)
      const agentId = nextId('agent')

      setMessages((prev) => [
        ...prev,
        { id: nextId('user'), role: 'user', text: userText, thinking: false, streaming: false, done: true },
        { id: agentId, role: 'agent', text: '', thinking: true, streaming: false, done: false },
      ])
      setBusy(true)
      setStep(0)

      // thinking phase
      await sleep(responseDelay / animSpeed)
      if (!alive(runId)) return
      setStep(1)
      setMessages((prev) =>
        updateAgent(prev, agentId, { thinking: false, toolName: `search_files("${query}")` }),
      )

      // tool call phase
      await sleep(toolCallDuration / animSpeed)
      if (!alive(runId)) return
      setStep(2)
      setMessages((prev) => updateAgent(prev, agentId, { toolResult: TOOL_RESULT, streaming: true }))

      // streaming phase
      setStep(3)
      const answer = CANNED_ANSWER
      for (let i = 0; i <= answer.length; i++) {
        if (!alive(runId)) return
        const partial = answer.slice(0, i)
        setMessages((prev) => updateAgent(prev, agentId, { text: partial }))
        if (i < answer.length) await sleep(1000 / typingSpeed / animSpeed)
      }
      if (!alive(runId)) return
      setMessages((prev) => updateAgent(prev, agentId, { streaming: false, done: true }))
      setBusy(false)
      setStep(4)
    },
    [typingSpeed, responseDelay, toolCallDuration, animSpeed],
  )

  const send = () => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    void runAgent(text)
  }

  const runDemo = () => {
    if (busy) return
    void runAgent('请演示一个完整的分析流程')
  }

  const clear = () => {
    runIdRef.current++
    setMessages([])
    setBusy(false)
    setStep(0)
  }

  if (preview) {
    // static chat bubbles
    return (
      <div style={{ position: 'absolute', inset: 0, background: pal.bg, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ alignSelf: 'flex-end', maxWidth: '70%', background: accent, color: '#fff', borderRadius: 12, padding: '8px 12px', fontSize: 12 }}>
          帮我分析这个项目
        </div>
        <div style={{ alignSelf: 'flex-start', maxWidth: '78%', background: pal.agentBubble, color: pal.text, borderRadius: 12, padding: '8px 12px', fontSize: 12, border: `1px solid ${pal.border}` }}>
          正在分析…已找到 3 个相关文件。
        </div>
      </div>
    )
  }

  const progress = (step / STEPS.length) * 100

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: pal.bg,
        color: pal.text,
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      {/* header */}
      <div style={{ padding: '10px 14px', background: pal.panel, borderBottom: `1px solid ${pal.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}` }} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>AI Agent · 本地模拟</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button onClick={runDemo} disabled={busy} style={btn(pal, accent, busy)}>
              ▶ 运行演示
            </button>
            <button onClick={clear} style={btn(pal, accent, false)}>
              清空
            </button>
          </div>
        </div>
        {/* progress steps */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 11,
                padding: '4px 0',
                borderRadius: 6,
                color: i < step ? '#fff' : i === step ? accent : pal.sub,
                background: i < step ? accent : i === step ? rgba(accent, 0.15) : pal.agentBubble,
                transition: `all ${0.25 / animSpeed}s ease`,
              }}
            >
              {i < step ? '✓ ' : ''}
              {s}
            </div>
          ))}
        </div>
        <div style={{ height: 3, background: pal.agentBubble, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: accent,
              transition: `width ${0.3 / animSpeed}s ease`,
            }}
          />
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', color: pal.sub, fontSize: 12 }}>
            输入一条消息，或点击「运行演示」查看完整流程
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'user' ? (
              <div style={{ maxWidth: '72%', background: accent, color: '#fff', borderRadius: 12, borderBottomRightRadius: 3, padding: '8px 12px', fontSize: 13, whiteSpace: 'pre-wrap' }}>
                {m.text}
              </div>
            ) : (
              <>
                {m.thinking && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: pal.sub, fontSize: 12 }}>
                    <span className="ai-spinner" style={{ width: 12, height: 12, border: `2px solid ${pal.border}`, borderTopColor: accent, borderRadius: '50%', animation: `spin ${0.8 / animSpeed}s linear infinite` }} />
                    思考中…
                  </div>
                )}
                {m.toolName && !m.toolResult && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: pal.toolBg, border: `1px solid ${pal.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: pal.text, fontFamily: 'ui-monospace, monospace' }}>
                    <span className="ai-spinner" style={{ width: 12, height: 12, border: `2px solid ${pal.border}`, borderTopColor: accent, borderRadius: '50%', animation: `spin ${0.8 / animSpeed}s linear infinite` }} />
                    🔧 {m.toolName}
                  </div>
                )}
                {m.toolName && m.toolResult && (
                  <div style={{ background: pal.toolBg, border: `1px solid ${pal.border}`, borderLeft: `3px solid ${accent}`, borderRadius: 6, padding: '8px 10px', fontSize: 11, color: pal.sub, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap' }}>
                    <div style={{ color: pal.text, marginBottom: 4 }}>🔧 {m.toolName} → 结果</div>
                    {m.toolResult}
                  </div>
                )}
                {(m.streaming || m.done || m.text) && (
                  <div
                    style={{
                      maxWidth: '82%',
                      background: pal.agentBubble,
                      color: pal.text,
                      border: `1px solid ${pal.border}`,
                      borderRadius: 12,
                      borderBottomLeftRadius: 3,
                      padding: '8px 12px',
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    {m.text}
                    {m.streaming && <span style={{ display: 'inline-block', width: 7, height: 14, background: accent, marginLeft: 2, verticalAlign: 'text-bottom', animation: `blink ${0.8 / animSpeed}s steps(2) infinite` }} />}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* input */}
      <div style={{ display: 'flex', gap: 8, padding: 12, background: pal.panel, borderTop: `1px solid ${pal.border}` }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send()
          }}
          placeholder="输入消息，回车发送…"
          style={{
            flex: 1,
            background: pal.bg,
            border: `1px solid ${pal.border}`,
            borderRadius: 8,
            color: pal.text,
            padding: '8px 12px',
            fontSize: 13,
          }}
        />
        <button onClick={send} disabled={busy || !input.trim()} style={btn(pal, accent, busy || !input.trim())}>
          发送
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  )
}

function btn(pal: Palette, accent: string, disabled = false): React.CSSProperties {
  return {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 8,
    border: `1px solid ${disabled ? pal.border : rgba(accent, 0.6)}`,
    background: disabled ? pal.agentBubble : rgba(accent, 0.2),
    color: disabled ? pal.sub : pal.text,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

export const Preview: ExperimentModule['Preview'] = (props) => <AiAgentUi {...props} preview />
export const Renderer: ExperimentModule['Renderer'] = (props) => <AiAgentUi {...props} />

const module: ExperimentModule = { Preview, Renderer }
export default module
export { definition }
