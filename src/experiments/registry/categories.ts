import type { ExperimentCategory } from '@/types/experiment'

export const CATEGORIES: ExperimentCategory[] = [
  {
    id: '3d',
    name: '3D 空间与物体变换',
    description: '卡片、多面体、悬浮空间等三维物体变换与光照实验。',
    icon: 'cube',
  },
  {
    id: 'scroll',
    name: '高级滚动视觉效果',
    description: '滚动驱动 3D、横向叙事、多层视差与液态转场。',
    icon: 'scroll',
  },
  {
    id: 'mouse',
    name: '鼠标交互与动态特效',
    description: '玻璃质感、粒子跟随、液化扭曲与磁吸交互。',
    icon: 'pointer',
  },
  {
    id: 'visual',
    name: '极限视觉表现',
    description: '全息投影、模型拆解、流体模拟与沉浸式世界。',
    icon: 'sparkles',
  },
  {
    id: 'functional',
    name: '复杂功能型 UI',
    description: '节点编辑器、数据大屏、专业工具与 AI Agent 界面。',
    icon: 'grid',
  },
  {
    id: 'dataviz',
    name: '数据可视化与动态展示',
    description: '动态图表、联动数据与实时刷新展示。',
    icon: 'chart',
  },
  {
    id: 'ui',
    name: '创意 UI 组件与交互实验',
    description: '可复用、可交互的创意界面组件。',
    icon: 'layers',
  },
]

export function getCategory(id: string): ExperimentCategory | undefined {
  return CATEGORIES.find((c) => c.id === id)
}
