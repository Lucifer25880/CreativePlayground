# 数据模型

所有模型具有明确 TypeScript 定义，见 `src/types/`。配置支持 JSON 序列化 / 反序列化。

## Experiment（实验定义）

`src/types/experiment.ts`

```ts
interface ExperimentDefinition {
  id: string                 // e.g. '3d-card-rotation'
  name: string
  description: string
  longDescription?: string
  category: ExperimentCategoryId // '3d'|'scroll'|'mouse'|'visual'|'functional'|'dataviz'|'ui'
  tags: string[]
  difficulty: 'beginner'|'intermediate'|'advanced'|'expert'
  rendererType: 'three'|'canvas2d'|'dom'|'webgl'|'mixed'
  version: string
  defaultConfig: ExperimentConfig
  parameterSchema: ParameterSchema
  presets: PresetConfig[]
  interactionSchema: InteractionSchema
  animationSchema: AnimationSchema
  promptTemplate?: string
  createdAt: string
  updatedAt: string
}
```

## Config / 参数

`src/types/config.ts`

- `ConfigValue`：`number | boolean | string | Vector2 | Vector3 | ConfigValue[] | object`。
- `ExperimentConfig`：`Record<string, ConfigValue>`（扁平，便于 JSON 序列化与实时 diff）。
- `ParameterDefinition`：`{ id, label, type, group?, min?, max?, step?, unit?, options?, defaultValue, advanced?, description? }`。
- `ParamType`：`number | boolean | string | color | select | vector2 | vector3 | range | object | array`。

## Prompt / PromptVersion

`src/types/prompt.ts`

```ts
interface Prompt {
  id: string
  title: string
  description: string
  category: string
  content: string
  sourceExperimentId?: string
  sourceWorkId?: string
  generationMode: 'full'|'from-config'|'enhance'|'directed'
  targetTool: 'codex'|'claude-code'|'cursor'|'gemini'|'generic'
  tags: string[]
  favorite: boolean
  currentVersion: number
  createdAt: string
  updatedAt: string
}

interface PromptVersion {
  id: string
  promptId: string
  versionNumber: number
  content: string
  generationMode: PromptGenerationMode
  userInstruction?: string
  sourceConfigSnapshot?: ExperimentConfig
  createdAt: string
}
```

## Remix / RemixVersion

`src/types/remix.ts`

```ts
interface Remix {
  id: string
  title: string
  description: string
  sourceExperimentId: string
  sourceWorkId?: string
  config: ExperimentConfig
  thumbnail?: string
  currentVersion: number
  createdAt: string
  updatedAt: string
}

interface RemixVersion {
  id: string
  remixId: string
  versionNumber: number
  configSnapshot: ExperimentConfig
  description?: string
  createdAt: string
}
```

## Work（作品）

`src/types/work.ts`

```ts
interface Work {
  id: string
  title: string
  description: string
  sourceType: 'experiment'|'remix'|'composition'|'custom'
  sourceExperimentId?: string
  sourceRemixId?: string
  config: ExperimentConfig
  promptIds: string[]      // 关联提示词
  thumbnail?: string
  tags: string[]
  favorite: boolean
  createdAt: string
  updatedAt: string
}
```

## 存储键（collection 名）

| 集合 | 说明 |
| --- | --- |
| `savedConfig` | 已保存实验配置（configService） |
| `remix` / `remixVersion` | Remix 与版本 |
| `prompt` / `promptVersion` | 提示词与版本 |
| `work` | 作品 |
| `pref` | 偏好与收藏 |
