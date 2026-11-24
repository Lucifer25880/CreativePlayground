# Creative Playground

一个面向前端开发者、创意设计师、AI 编程使用者与视觉效果爱好者的**交互式视觉实验与 AI 创作平台**。

核心理念：**Explore → Experiment → Remix → Generate → Save**（探索 → 实验 → 二次创作 → 生成提示词 → 保存作品）。

## ✨ 特性

- **展示层 Showcase**：高品质动态首页、视觉展厅、按分类浏览、真实动态预览卡片。
- **实验层 Playground**：20 个真实可交互的视觉实验、统一参数系统、实时参数控制、预设 / 随机 / 重置 / 保存 / 对比 / 导入导出。
- **创作层 Creative Studio**：Remix 二次创作与版本管理、本地模板 Prompt 生成器（4 种模式 + 版本对比）、提示词库、我的作品。
- **本地优先**：数据存储在 localStorage + IndexedDB，无需登录、无需 AI Key 即可离线使用提示词生成器。

## 🚀 快速开始

> 依赖：Node.js ≥ 18。

```bash
npm install        # 或 pnpm install
npm run dev        # 启动开发服务器，默认 http://localhost:5173
```

其他命令：

```bash
npm run build      # 类型检查 + 生产构建
npm run preview    # 预览生产构建
npm run typecheck  # 仅类型检查
```

## 🧭 路由

| 路径 | 页面 |
| --- | --- |
| `/` | 首页 |
| `/explore` | 视觉展厅 |
| `/explore/:experimentId` | 实验详情 |
| `/playground/:experimentId` | 实时实验（Live Playground） |
| `/studio` | 创作工作室 |
| `/studio/remix/:remixId` | 二次创作编辑器 |
| `/prompt-generator/:experimentId` | 提示词生成器 |
| `/prompts` | 提示词库 |
| `/prompts/:promptId` | 提示词详情 |
| `/works` | 我的作品 |
| `/works/:workId` | 作品详情 |
| `/settings` | 设置 |

## 🧪 首批 20 个实验

| # | 实验 | 分类 | 渲染 |
| --- | --- | --- | --- |
| 01 | 3D 卡片旋转 | 3D | three |
| 02 | 3D 卡片轮播 | 3D | three |
| 03 | 3D 多面体交互 | 3D | three |
| 04 | 3D 悬浮空间 | 3D | three |
| 05 | 滚动驱动 3D 动画 | 滚动 | three |
| 06 | 横向滚动叙事 | 滚动 | dom |
| 07 | 多层视差滚动 | 滚动 | dom |
| 08 | 液态形变转场 | 滚动 | dom |
| 09 | 液态玻璃 UI | 创意 UI | dom |
| 10 | 粒子跟随鼠标 | 鼠标 | canvas2d |
| 11 | 图片液化扭曲 | 鼠标 | canvas2d |
| 12 | 磁吸鼠标交互 | 鼠标 | dom |
| 13 | 全息投影 UI | 视觉 | dom |
| 14 | 3D 模型拆解 | 视觉 | three |
| 15 | 流体模拟视觉 | 视觉 | canvas2d |
| 16 | 沉浸式 3D 世界 | 视觉 | three |
| 17 | 节点式可视化编辑器 | 功能 | dom |
| 18 | 数据可视化大屏 | 数据可视化 | canvas2d |
| 19 | 专业工具类界面 | 功能 | dom |
| 20 | AI Agent 交互界面 | 功能 | dom |

## 🏗️ 技术栈

React 18 · TypeScript · Vite · Tailwind CSS · React Router · Zustand · Framer Motion · GSAP · Three.js · React Three Fiber · Drei

## 📁 目录结构

```
src/
├── app/            # 入口与路由
├── components/     # 通用 / 布局 / 导航 / 卡片 / 控件
├── pages/          # 各页面
├── experiments/    # 实验注册表 + 分类 + 共享 hooks
├── engine/         # 参数引擎
├── features/       # 提示词生成器等特性
├── services/       # 数据服务（storage/config/prompt/remix/work）
├── stores/         # Zustand 状态
├── types/          # 统一类型定义
├── hooks/ utils/ styles/
```

## 📚 文档

见 [`docs/`](./docs/)：产品概览、架构、数据模型、实验注册表、开发计划、API 设计、测试计划、变更日志。

## ⚠️ 说明

- **提示词生成器**当前使用**本地模板引擎**，未接入真实 AI（可完全离线使用）。AI 服务通过可插拔接口预留，接入 OpenAI / Gemini / Claude 时密钥必须置于服务端。
- 所有视觉实验均为程序化生成，无外部资源依赖。
