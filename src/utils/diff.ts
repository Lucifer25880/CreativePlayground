export interface DiffLine {
  type: 'same' | 'add' | 'del'
  text: string
}

/** Line-based LCS diff with a safety fallback for very large inputs. */
export function diffLines(a: string, b: string): DiffLine[] {
  const al = a.split('\n')
  const bl = b.split('\n')
  const n = al.length
  const m = bl.length

  if (n * m > 1_200_000) {
    return naiveDiff(al, bl)
  }

  const dp: Int32Array[] = []
  for (let i = 0; i <= n; i++) dp.push(new Int32Array(m + 1))

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = al[i] === bl[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (al[i] === bl[j]) {
      out.push({ type: 'same', text: al[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: al[i] })
      i++
    } else {
      out.push({ type: 'add', text: bl[j] })
      j++
    }
  }
  while (i < n) out.push({ type: 'del', text: al[i++] })
  while (j < m) out.push({ type: 'add', text: bl[j++] })
  return out
}

function naiveDiff(al: string[], bl: string[]): DiffLine[] {
  const out: DiffLine[] = []
  const setB = new Set(bl)
  const used = new Set<string>()
  for (const l of al) {
    if (setB.has(l) && !used.has(l)) {
      out.push({ type: 'same', text: l })
      used.add(l)
    } else {
      out.push({ type: 'del', text: l })
    }
  }
  const setA = new Set(al)
  for (const l of bl) {
    if (!setA.has(l) || used.has(l)) out.push({ type: 'add', text: l })
  }
  return out
}
