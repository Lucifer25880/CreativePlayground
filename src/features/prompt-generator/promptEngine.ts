import type { ExperimentConfig, ParameterSchema } from '@/types/config'
import type { ExperimentDefinition } from '@/types/experiment'
import type { PromptGenerationMode, PromptGeneratorOptions, TargetTool } from '@/types/prompt'
import { getCategory } from '@/experiments/registry/categories'

export interface GeneratePromptInput {
  definition: ExperimentDefinition
  config: ExperimentConfig
  defaultConfig: ExperimentConfig
  mode: PromptGenerationMode
  userInstruction?: string
  options: PromptGeneratorOptions
}

const TOOL_LABEL: Record<TargetTool, string> = {
  codex: 'OpenAI Codex',
  'claude-code': 'Claude Code',
  cursor: 'Cursor',
  gemini: 'Google Gemini',
  generic: '通用 AI 编程助手',
}

function formatConfigBlock(config: ExperimentConfig): string {
  return '```json\n' + JSON.stringify(config, null, 2) + '\n```'
}

function formatParamTable(
  schema: ParameterSchema,
  config: ExperimentConfig,
  defaults: ExperimentConfig,
): string {
  const rows = schema.map((p) => {
    const current = config[p.id]
    const def = defaults[p.id]
    const modified = JSON.stringify(current) !== JSON.stringify(def)
    const currentStr = formatValue(current)
    const defStr = formatValue(def)
    return `| \`${p.id}\` | ${p.label} | \`${currentStr}\` | \`${defStr}\` | ${modified ? '✅ 修改' : '默认'} |`
  })
  return ['| 参数 | 说明 | 当前值 | 默认值 | 状态 |', '| --- | --- | --- | --- | --- |', ...rows].join('\n')
}

function formatValue(v: unknown): string {
  if (v === undefined || v === null) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function techStackLine(options: PromptGeneratorOptions, definition: ExperimentDefinition): string {
  const base = new Set<string>(options.techStack)
  if (definition.rendererType === 'three' || definition.rendererType === 'webgl') {
    base.add('Three.js')
    base.add('React Three Fiber')
    base.add('@react-three/drei')
  }
  if (definition.rendererType === 'canvas2d') base.add('Canvas 2D API')
  if (definition.tags.some((t) => /gsap/i.test(t))) base.add('GSAP')
  return [...base].join('、')
}

export function generatePrompt(input: GeneratePromptInput): string {
  const { definition, config, defaultConfig, mode, options } = input
  const category = getCategory(definition.category)
  const tech = techStackLine(options, definition)
  const modifiedParams = definition.parameterSchema.filter(
    (p) => JSON.stringify(config[p.id]) !== JSON.stringify(defaultConfig[p.id]),
  )
  const interactionLines: string[] = []
  if (definition.interactionSchema.mouse) interactionLines.push('鼠标移动与悬停交互')
  if (definition.interactionSchema.drag) interactionLines.push('鼠标/触摸拖拽')
  if (definition.interactionSchema.scroll) interactionLines.push('滚动驱动')
  if (definition.interactionSchema.keyboard) interactionLines.push('键盘交互')
  if (definition.interactionSchema.touch) interactionLines.push('触摸支持')
  if (definition.interactionSchema.description) interactionLines.push(definition.interactionSchema.description)
  if (interactionLines.length === 0) interactionLines.push('基础交互反馈')

  const modeNote =
    mode === 'full'
      ? '本次为**完整重新生成**：围绕实验主题重新组织全部内容，不依赖历史提示词。'
      : mode === 'from-config'
        ? '本次为**基于当前配置生成**：以下参数配置与交互行为已实际写入提示词。'
        : mode === 'enhance'
          ? '本次为**增强效果**：在保留核心设计的基础上，进一步提高视觉、动画、材质、光照与细节表现。'
          : '本次为**指定方向修改**：结合用户额外要求，围绕当前实验进行针对性重生成。'

  const directive =
    mode === 'directed' && input.userInstruction
      ? input.userInstruction.trim()
      : mode === 'enhance'
        ? '在不改变核心交互的前提下，增强整体视觉表现、动画细腻度、材质质感、光照层次与细节丰富度。'
        : ''

  const perf = options.performance
  const perfLine =
    perf === 'optimized'
      ? '高性能优先：使用 requestAnimationFrame 统一驱动动画、按需渲染、合理降级、正确释放 Three.js 资源（geometry/material/texture），避免内存泄漏。'
      : perf === 'balanced'
        ? '性能与质量平衡：控制帧率与粒子数量，提供质量等级切换。'
        : '基础性能即可：保证流畅运行，允许适当降低渲染质量。'

  const sections: string[] = []

  sections.push(`# ${definition.name} — AI 编程提示词`)
  sections.push('')
  sections.push(`> 目标工具：${TOOL_LABEL[options.targetTool]} | 生成模式：${modeLabel(mode)} | 实验版本：${definition.version}`)
  sections.push('')
  sections.push(`> ${modeNote}`)

  // 1. ROLE
  sections.push('## 1. ROLE 角色设定')
  sections.push(
    '你是一名资深前端工程师、Creative Developer 与 Three.js/WebGL 图形开发专家，精通 React、TypeScript、动画系统与交互设计。请以产品级标准实现以下视觉实验。',
  )

  // 2. PROJECT OVERVIEW
  sections.push('## 2. PROJECT OVERVIEW 项目背景')
  sections.push(definition.description)
  if (definition.longDescription) sections.push(definition.longDescription)

  // 3. PROJECT GOALS
  sections.push('## 3. PROJECT GOALS 项目目标')
  sections.push(
    `- 实现一个可交互、可参数化的「${definition.name}」视觉实验。\n- 视觉效果真实、有质感，参数变化实时生效。\n- 交互反馈明确（hover / active / focus / loading / success / error / empty）。\n- 代码模块化、类型安全，方便二次创作与扩展。`,
  )

  // 4. VISUAL DESIGN
  sections.push('## 4. VISUAL DESIGN 视觉设计')
  sections.push(
    `- 视觉风格：${options.visualStyle}。\n- 分类：${category?.name ?? definition.category}。\n- 采用深色创意科技风，玻璃质感、细腻边框、适度发光，避免无意义的光污染，保证文字可读性。\n- 难度等级：${definition.difficulty}。\n- 技术标签：${definition.tags.join('、')}。`,
  )

  // 5. SCENE STRUCTURE
  sections.push('## 5. SCENE STRUCTURE 场景结构')
  sections.push(
    `- 渲染方式：${definition.rendererType}。\n- 动画系统：${definition.animationSchema.description ?? '循环动画，requestAnimationFrame 驱动'}。\n- 场景结构描述：${definition.promptTemplate ?? '根据实验主题构建场景。'}`,
  )

  // 6. COMPONENT ARCHITECTURE
  sections.push('## 6. COMPONENT ARCHITECTURE 组件架构')
  if (options.includeProjectStructure) {
    sections.push(
      `请按如下职责拆分（不要写进单一巨型组件）：\n\n\`\`\`\n<ExperimentName>/\n├── index.tsx        # 入口与 Canvas 装配\n├── Scene.tsx        # 场景图\n├── components/      # 场景内子组件\n├── useAnimation.ts  # 动画循环 hook\n└── config.ts        # 参数 schema 与默认配置\n\`\`\``,
    )
  } else {
    sections.push('将渲染器、参数系统、动画循环与交互逻辑职责分离，保持组件复用与类型安全。')
  }

  // 7. INTERACTION DESIGN
  sections.push('## 7. INTERACTION DESIGN 交互设计')
  sections.push(interactionLines.map((l) => `- ${l}`).join('\n'))
  if (directive) sections.push(`- 额外要求：${directive}`)

  // 8. ANIMATION SYSTEM
  sections.push('## 8. ANIMATION SYSTEM 动画系统')
  sections.push(
    `- 使用 requestAnimationFrame 管理自定义动画（统一时钟，delta time 驱动，保证不同帧率下速度一致）。\n- 对高频事件（鼠标移动、滚动）进行节流或合并。\n- 动画可暂停、可降级，避免阻塞主线程。`,
  )

  // 9. MATERIAL AND SHADER
  sections.push('## 9. MATERIAL AND SHADER 材质与 Shader')
  sections.push(
    '根据实验类型实现相应材质：金属度/粗糙度/发光（PBR）、玻璃折射与模糊、粒子 Shader 或 Canvas 近似流体等。材质参数必须可配置并实时生效。',
  )

  // 10. PARAMETER CONFIGURATION
  sections.push('## 10. PARAMETER CONFIGURATION 参数配置')
  sections.push('当前参数（JSON 配置）：')
  sections.push(formatConfigBlock(config))
  sections.push('参数明细（含默认值对比）：')
  sections.push(formatParamTable(definition.parameterSchema, config, defaultConfig))
  if (modifiedParams.length > 0) {
    sections.push(`本次修改过的参数：${modifiedParams.map((p) => `\`${p.id}\``).join('、')}。`)
  }

  // 11. TECHNICAL STACK
  sections.push('## 11. TECHNICAL STACK 技术栈')
  sections.push(`- ${tech}\n- 状态管理：Zustand（如需）\n- 构建：Vite`)

  // 12. RESPONSIVE DESIGN
  sections.push('## 12. RESPONSIVE DESIGN 响应式设计')
  sections.push(
    options.responsive
      ? '优先适配 1920×1080 / 1440×900 / 1366×768，桌面端为创作主环境，移动端保留浏览与基础操作；复杂 3D 效果按设备性能降级。'
      : '以桌面端为主，保证固定画布比例下的清晰呈现。',
  )

  // 13. PERFORMANCE
  sections.push('## 13. PERFORMANCE 性能要求')
  sections.push(perfLine)

  // 14. ERROR HANDLING
  sections.push('## 14. ERROR HANDLING 异常处理')
  sections.push(
    '处理 WebGL 不可用、组件加载失败、资源加载失败等情况，提供友好提示与安全降级（fallback），并保证卸载时清理资源。',
  )

  // 15. ACCEPTANCE CRITERIA
  if (options.includeAcceptanceCriteria) {
    sections.push('## 15. ACCEPTANCE CRITERIA 验收标准')
    sections.push(
      `- [ ] 效果可运行且无控制台报错\n- [ ] 参数修改实时反映到渲染结果\n- [ ] 交互反馈明确\n- [ ] 资源正确释放，反复进出无内存泄漏\n- [ ] 代码类型安全、模块化、可读`,
    )
  }

  // 16. DEVELOPMENT INSTRUCTIONS
  if (options.includeRunInstructions) {
    sections.push('## 16. DEVELOPMENT INSTRUCTIONS 开发实施要求')
    sections.push(
      '请使用 TypeScript + React 实现，遵循模块化结构；提供 `npm install` / `pnpm install` 与 `npm run dev` 运行说明；完成后自查并修复明显问题。',
    )
  }

  return sections.join('\n\n')
}

function modeLabel(mode: PromptGenerationMode): string {
  switch (mode) {
    case 'full':
      return '完整重新生成'
    case 'from-config':
      return '基于当前配置生成'
    case 'enhance':
      return '增强效果'
    case 'directed':
      return '指定方向修改'
  }
}
