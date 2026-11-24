# 架构

## 三层架构

```
┌─────────────────────────────────────────────────────────────┐
│ 展示层 Showcase                                              │
│  Home / Explore / ExperimentDetail                           │
│  (首页、展厅、动态预览卡片、详情)                              │
├─────────────────────────────────────────────────────────────┤
│ 实验层 Playground                                            │
│  Live Playground / Parameter Engine / 组合实验                │
│  (实时参数控制、预设、随机、保存、对比、导入导出)               │
├─────────────────────────────────────────────────────────────┤
│ 创作层 Creative Studio                                        │
│  Remix Studio / Prompt Generator / Prompt Library / My Works │
│  (二次创作、版本管理、提示词生成、作品管理)                     │
└─────────────────────────────────────────────────────────────┘
            ↓ 共享统一数据模型（types/）与数据服务（services/）
```

三个层次共享同一套 `ExperimentDefinition` / `ExperimentConfig` 等类型定义，不产生数据孤岛。

## 目录结构

```
src/
├── app/            # router.tsx、入口装配
├── components/
│   ├── common/     # Icon、Modal、Toast、ErrorBoundary、Badges、MarkdownView…
│   ├── layout/     # AppLayout、PlaygroundLayout
│   ├── navigation/ # Navbar、Footer
│   ├── cards/      # ExperimentCard（动态预览）
│   └── controls/   # ControlPanel、ParamControl
├── pages/          # 路由页面（懒加载）
├── experiments/
│   ├── registry/   # registry.ts（定义 + 懒加载组件）、categories.ts
│   ├── shared/     # types、useAnimationFrame、useElementSize、usePointer
│   ├── 3d/ scroll/ mouse/ ui/ visual/ functional/ dataviz/
├── engine/
│   └── parameter-engine/  # normalizeConfig、randomizeConfig、applyPreset
├── features/
│   └── prompt-generator/  # promptEngine.ts（本地模板生成）
├── services/       # storageService、configService、remixService、promptService、workService
├── stores/         # preferences、playground、experiment、prompt、remix、work
├── types/          # config、experiment、prompt、remix、work
├── hooks/ utils/ styles/ assets/
```

## 关键设计

### 实验模块契约

每个实验由两个文件组成（用于代码分割）：

- `meta.ts`：导出纯数据的 `definition: ExperimentDefinition`（参数 schema、默认配置、预设、交互/动画 schema、提示词模板）。注册表静态导入（轻量）。
- `index.tsx`：导出 `Preview` 与 `Renderer` 两个 React 组件。注册表用 `React.lazy` 按需加载。

组件统一接收 `{ config, preview? }`，`config` 为扁平参数对象，参数变化即实时生效。

### 数据服务抽象

页面 / store 一律通过 `services/*` 访问数据，不直接操作 `localStorage` / `IndexedDB`：

- JSON 元数据 → `localStorage`（不可用时内存降级）
- 大对象（缩略图等）→ `IndexedDB`

### 渲染资源管理

- Three.js 实验统一使用 React Three Fiber `<Canvas>`，卸载时自动释放 renderer / geometry / material。
- Canvas 2D / DOM 实验使用 `useAnimationFrame` + `useEffect` 清理，避免内存泄漏。

### 性能

- 路由与实验组件懒加载；Three.js 单独分包（manualChunks）。
- 预览模式（卡片缩略图）降低 DPR、关闭阴影、减少粒子。
- 质量等级（低/中/高）与「减少动态效果」偏好。

## 提示词生成

`features/prompt-generator/promptEngine.ts` 为**本地模板引擎**：读取实验元数据 + 当前配置 + 修改项 + 生成选项，产出 16 段结构化 Markdown 提示词。AI 接入通过可插拔服务层预留，密钥仅允许置于服务端。
