import type { ComponentType } from 'react'

/**
 * Props passed to every experiment Preview and Renderer component.
 * `config` is intentionally typed loosely: it is a flat object of mixed
 * primitives (numbers, color strings, booleans, small vectors). Renderers read
 * values with Number(config.x) / String(config.x) / truthiness and must react
 * to changes in real time.
 */
export interface ExperimentComponentProps {
  config: Record<string, any>
  /** true when rendered as a small card preview — reduce quality, disable heavy FX. */
  preview?: boolean
}

/** The render contract every experiment module must implement. */
export interface ExperimentModule {
  Preview: ComponentType<ExperimentComponentProps>
  Renderer: ComponentType<ExperimentComponentProps>
}
