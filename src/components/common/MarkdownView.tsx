import { Fragment, type ReactNode } from 'react'

/** Minimal markdown renderer for headings, code fences, lists, blockquotes, tables, bold + inline code. */
export function MarkdownView({ content }: { content: string }) {
  const lines = content.split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let key = 0

  function inline(text: string): ReactNode {
    // split by inline code first, then bold
    const parts = text.split(/(`[^`]+`)/g)
    return parts.map((p, idx) => {
      if (/^`[^`]+`$/.test(p)) {
        return (
          <code key={idx} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em] text-accent-cyan">
            {p.slice(1, -1)}
          </code>
        )
      }
      return renderBold(p, idx)
    })
  }

  function renderBold(text: string, baseKey: number): ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((p, idx) => {
      if (/^\*\*[^*]+\*\*$/.test(p)) {
        return (
          <strong key={`${baseKey}-${idx}`} className="font-semibold text-white">
            {p.slice(2, -2)}
          </strong>
        )
      }
      return <Fragment key={`${baseKey}-${idx}`}>{p}</Fragment>
    })
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim().startsWith('```')) {
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i])
        i++
      }
      i++ // skip closing fence
      blocks.push(
        <pre key={key++} className="overflow-x-auto rounded-xl border border-white/10 bg-ink-950 p-4 font-mono text-xs leading-relaxed text-slate-300">
          {code.join('\n')}
        </pre>,
      )
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push(<h4 key={key++} className="mt-5 text-sm font-semibold text-white">{inline(line.slice(4))}</h4>)
      i++
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push(<h3 key={key++} className="mt-6 text-lg font-semibold text-white">{inline(line.slice(3))}</h3>)
      i++
      continue
    }
    if (line.startsWith('# ')) {
      blocks.push(<h2 key={key++} className="mt-4 text-xl font-bold text-white">{inline(line.slice(2))}</h2>)
      i++
      continue
    }

    if (line.trim() === '---') {
      blocks.push(<hr key={key++} className="my-4 border-white/10" />)
      i++
      continue
    }

    if (line.startsWith('> ')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quote.push(lines[i].slice(2))
        i++
      }
      blocks.push(
        <blockquote key={key++} className="my-3 rounded-r-lg border-l-2 border-accent/60 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
          {quote.map((q, idx) => (
            <Fragment key={idx}>
              {inline(q)}
              {idx < quote.length - 1 && <br />}
            </Fragment>
          ))}
        </blockquote>,
      )
      continue
    }

    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      blocks.push(
        <ul key={key++} className="my-2 space-y-1.5">
          {items.map((it, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-slate-300">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{inline(it)}</span>
            </li>
          ))}
        </ul>,
      )
      continue
    }

    if (line.trim().startsWith('|')) {
      const rows: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(lines[i])
        i++
      }
      blocks.push(
        <pre key={key++} className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-ink-950 p-4 font-mono text-xs text-slate-400">
          {rows.join('\n')}
        </pre>,
      )
      continue
    }

    if (line.trim() === '') {
      i++
      continue
    }

    // paragraph: accumulate consecutive non-empty non-special lines
    const para: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,3} |```|> |- |\||---)/.test(lines[i])) {
      para.push(lines[i])
      i++
    }
    blocks.push(
      <p key={key++} className="my-2 text-sm leading-relaxed text-slate-300">
        {para.map((p, idx) => (
          <Fragment key={idx}>
            {inline(p)}
            {idx < para.length - 1 && <br />}
          </Fragment>
        ))}
      </p>,
    )
  }

  return <div className="space-y-0.5">{blocks}</div>
}
