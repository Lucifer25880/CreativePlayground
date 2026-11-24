# 变更日志

## 1.0.0（初始版本）

### 新增
- 项目骨架：React 18 + TypeScript + Vite + Tailwind + React Router + Zustand。
- 三层架构：展示层 / 实验层 / 创作层。
- 统一数据模型与本地数据服务（localStorage + IndexedDB，抽象接口）。
- 展示层：动态首页、视觉展厅、实验详情。
- 实验层：20 个交互式视觉实验（3D / 滚动 / 鼠标 / 视觉 / 功能 / 数据可视化 / 创意 UI）。
- 统一参数引擎与实时 Playground（预设 / 随机 / 重置 / 保存 / 对比 / 导入导出）。
- 创作层：Remix Studio + 版本管理、本地模板 Prompt Generator（4 模式 + 版本对比）、Prompt Library、My Works。
- 提示词与作品 / 实验关联互通。
- 文档：README + docs/（产品概览 / 架构 / 数据模型 / 实验注册表 / 开发计划 / API 设计 / 测试计划）。

### 说明
- 提示词生成使用本地模板引擎，未接入真实 AI；AI 接口已预留可插拔设计。
- 所有视觉实验为程序化生成，无外部资源依赖。
