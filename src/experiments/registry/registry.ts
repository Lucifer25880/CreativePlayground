import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { ExperimentDefinition, ExperimentCategoryId } from '@/types/experiment'
import type { ExperimentComponentProps } from '../shared/types'

/* ------------------------------------------------------------------ */
/* Static metadata (pure data, no heavy imports)                       */
/* ------------------------------------------------------------------ */

import { definition as cardRotation } from '../3d/cardRotation/meta'
import { definition as cardCarousel } from '../3d/cardCarousel/meta'
import { definition as polyhedron } from '../3d/polyhedron/meta'
import { definition as floatingSpace } from '../3d/floatingSpace/meta'
import { definition as scrollDriven3d } from '../scroll/scrollDriven3d/meta'
import { definition as horizontalNarrative } from '../scroll/horizontalNarrative/meta'
import { definition as parallax } from '../scroll/parallax/meta'
import { definition as liquidMorph } from '../scroll/liquidMorph/meta'
import { definition as liquidGlass } from '../ui/liquidGlass/meta'
import { definition as particleFollow } from '../mouse/particleFollow/meta'
import { definition as imageLiquify } from '../mouse/imageLiquify/meta'
import { definition as magneticMouse } from '../mouse/magneticMouse/meta'
import { definition as holographic } from '../visual/holographic/meta'
import { definition as modelExplode } from '../visual/modelExplode/meta'
import { definition as fluid } from '../visual/fluid/meta'
import { definition as immersiveWorld } from '../visual/immersiveWorld/meta'
import { definition as nodeEditor } from '../functional/nodeEditor/meta'
import { definition as dataDashboard } from '../dataviz/dataDashboard/meta'
import { definition as proToolUi } from '../functional/proToolUi/meta'
import { definition as aiAgentUi } from '../functional/aiAgentUi/meta'

const DEFINITIONS: ExperimentDefinition[] = [
  cardRotation,
  cardCarousel,
  polyhedron,
  floatingSpace,
  scrollDriven3d,
  horizontalNarrative,
  parallax,
  liquidMorph,
  liquidGlass,
  particleFollow,
  imageLiquify,
  magneticMouse,
  holographic,
  modelExplode,
  fluid,
  immersiveWorld,
  nodeEditor,
  dataDashboard,
  proToolUi,
  aiAgentUi,
]

const byId = new Map<string, ExperimentDefinition>(DEFINITIONS.map((d) => [d.id, d]))

/* ------------------------------------------------------------------ */
/* Lazy component loaders                                              */
/* ------------------------------------------------------------------ */

type ModuleExports = {
  Preview: ComponentType<ExperimentComponentProps>
  Renderer: ComponentType<ExperimentComponentProps>
}

const loaders: Record<string, () => Promise<ModuleExports>> = {
  '3d-card-rotation': () => import('../3d/cardRotation'),
  '3d-card-carousel': () => import('../3d/cardCarousel'),
  '3d-polyhedron': () => import('../3d/polyhedron'),
  '3d-floating-space': () => import('../3d/floatingSpace'),
  'scroll-driven-3d': () => import('../scroll/scrollDriven3d'),
  'horizontal-scroll-narrative': () => import('../scroll/horizontalNarrative'),
  'multi-layer-parallax': () => import('../scroll/parallax'),
  'liquid-morph-transition': () => import('../scroll/liquidMorph'),
  'liquid-glass-ui': () => import('../ui/liquidGlass'),
  'particle-mouse-follow': () => import('../mouse/particleFollow'),
  'image-liquify': () => import('../mouse/imageLiquify'),
  'magnetic-mouse': () => import('../mouse/magneticMouse'),
  'holographic-ui': () => import('../visual/holographic'),
  'model-explode': () => import('../visual/modelExplode'),
  'fluid-simulation': () => import('../visual/fluid'),
  'immersive-3d-world': () => import('../visual/immersiveWorld'),
  'node-editor': () => import('../functional/nodeEditor'),
  'data-dashboard': () => import('../dataviz/dataDashboard'),
  'pro-tool-ui': () => import('../functional/proToolUi'),
  'ai-agent-ui': () => import('../functional/aiAgentUi'),
}

interface ComponentPair {
  Preview: LazyExoticComponent<ComponentType<ExperimentComponentProps>>
  Renderer: LazyExoticComponent<ComponentType<ExperimentComponentProps>>
}

const componentCache = new Map<string, ComponentPair>()

function getComponents(id: string): ComponentPair | null {
  if (!loaders[id]) return null
  if (!componentCache.has(id)) {
    const loader = loaders[id]
    componentCache.set(id, {
      Preview: lazy(() => loader().then((m) => ({ default: m.Preview }))),
      Renderer: lazy(() => loader().then((m) => ({ default: m.Renderer }))),
    })
  }
  return componentCache.get(id)!
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function listExperiments(): ExperimentDefinition[] {
  return DEFINITIONS
}

export function getExperiment(id: string): ExperimentDefinition | undefined {
  return byId.get(id)
}

export function getExperimentComponents(id: string): ComponentPair | null {
  return getComponents(id)
}

export function experimentsByCategory(category: ExperimentCategoryId): ExperimentDefinition[] {
  return DEFINITIONS.filter((d) => d.category === category)
}

export function searchExperiments(query: string): ExperimentDefinition[] {
  const q = query.trim().toLowerCase()
  if (!q) return DEFINITIONS
  return DEFINITIONS.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q)),
  )
}
