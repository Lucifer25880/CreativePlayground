# 开发计划

## 阶段一：项目骨架与展示层 ✅

- React + TypeScript + Vite + Tailwind + React Router + Zustand 初始化。
- 统一设计规范（暗色主题、glass/card/button 等设计 token）。
- 全局布局、导航、首页、Explore、实验详情。
- 实验注册机制与统一数据模型、本地数据服务接口。

## 阶段二：视觉实验库 ✅

- 首批 20 个实验全部实现，均有真实动态效果与交互（非静态图）。
- 每个实验：`meta.ts`（定义/参数/预设）+ `index.tsx`（Preview/Renderer）。
- 按需加载（React.lazy），实验间资源互不冲突。

## 阶段三：Live Playground 实验引擎 ✅

- 统一参数 Schema + 参数控件（slider / color / select / toggle / number / segment / vector）。
- 参数实时更新、重置、随机、预设切换、配置保存/恢复、参数对比、导入导出。

## 阶段四：Creative Studio 创作系统 ✅

- Remix Studio：复制配置、编辑、保存版本、恢复版本、保存为作品、删除。
- My Works：新建、编辑、复制、收藏、导入、导出、打开实验。

## 阶段五：Prompt Generator 与 Prompt Library ✅

- 本地模板生成（4 种模式）、自动读取当前配置。
- 提示词编辑器、复制、Markdown 导出、保存、重新生成、版本管理、版本差异对比。
- Prompt Library：搜索、分类、收藏、复制、删除、导出、从提示词创建 Remix。
- 预留可插拔 AI 服务接口。

## 阶段六：整体验收与打磨 ✅（持续）

- 视觉细节、过渡、性能、内存泄漏检查、导航/按钮/持久化全链路自测。
- 空状态与异常处理、README 与文档。

## 后续方向

- 自由组合编辑器（多效果叠加，当前为基础能力）。
- 服务端 AI 接入（OpenAI / Gemini / Claude 可插拔适配器，密钥服务端）。
- 账号体系与云端同步。
