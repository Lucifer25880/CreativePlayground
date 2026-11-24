# 实验注册表

注册表位于 `src/experiments/registry/registry.ts`，是实验定义与懒加载组件的唯一来源。

## 分类

| 分类 id | 名称 |
| --- | --- |
| `3d` | 3D 空间与物体变换 |
| `scroll` | 高级滚动视觉效果 |
| `mouse` | 鼠标交互与动态特效 |
| `visual` | 极限视觉表现 |
| `functional` | 复杂功能型 UI |
| `dataviz` | 数据可视化与动态展示 |
| `ui` | 创意 UI 组件与交互实验 |

## 实验清单

| id | 名称 | 分类 | 渲染 | 难度 |
| --- | --- | --- | --- | --- |
| `3d-card-rotation` | 3D 卡片旋转 | 3d | three | beginner |
| `3d-card-carousel` | 3D 卡片轮播 | 3d | three | intermediate |
| `3d-polyhedron` | 3D 多面体交互 | 3d | three | beginner |
| `3d-floating-space` | 3D 悬浮空间 | 3d | three | intermediate |
| `scroll-driven-3d` | 滚动驱动 3D 动画 | scroll | three | advanced |
| `horizontal-scroll-narrative` | 横向滚动叙事 | scroll | dom | intermediate |
| `multi-layer-parallax` | 多层视差滚动 | scroll | dom | beginner |
| `liquid-morph-transition` | 液态形变转场 | scroll | dom | advanced |
| `liquid-glass-ui` | 液态玻璃 UI | ui | dom | intermediate |
| `particle-mouse-follow` | 粒子跟随鼠标 | mouse | canvas2d | intermediate |
| `image-liquify` | 图片液化扭曲 | mouse | canvas2d | intermediate |
| `magnetic-mouse` | 磁吸鼠标交互 | mouse | dom | beginner |
| `holographic-ui` | 全息投影 UI | visual | dom | intermediate |
| `model-explode` | 3D 模型拆解 | visual | three | advanced |
| `fluid-simulation` | 流体模拟视觉 | visual | canvas2d | advanced |
| `immersive-3d-world` | 沉浸式 3D 世界 | visual | three | expert |
| `node-editor` | 节点式可视化编辑器 | functional | dom | expert |
| `data-dashboard` | 数据可视化大屏 | dataviz | canvas2d | intermediate |
| `pro-tool-ui` | 专业工具类界面 | functional | dom | advanced |
| `ai-agent-ui` | AI Agent 交互界面 | functional | dom | intermediate |

## 注册表 API

```ts
listExperiments(): ExperimentDefinition[]
getExperiment(id): ExperimentDefinition | undefined
getExperimentComponents(id): { Preview, Renderer } | null   // React.lazy 组件
experimentsByCategory(category): ExperimentDefinition[]
searchExperiments(query): ExperimentDefinition[]
```

## 新增实验步骤

1. 新建 `src/experiments/<category>/<folder>/meta.ts`，导出 `definition`（`ExperimentDefinition`）。
2. 新建同目录 `index.tsx`，导出 `Preview` 与 `Renderer`（接收 `{ config, preview? }`）。
3. 在 `registry.ts` 中：静态导入 `meta` 的 `definition`，并在 `loaders` 中登记 `id -> () => import('../<category>/<folder>')`。
