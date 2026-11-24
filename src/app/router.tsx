import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PlaygroundLayout } from '@/components/layout/PlaygroundLayout'

/** Wrap a default-export page module for React Router route-level lazy loading. */
function lazyPage(loader: () => Promise<{ default: ComponentType }>) {
  return async () => ({ Component: (await loader()).default })
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, lazy: lazyPage(() => import('@/pages/Home/Home')) },
      { path: 'explore', lazy: lazyPage(() => import('@/pages/Explore/Explore')) },
      { path: 'explore/:experimentId', lazy: lazyPage(() => import('@/pages/ExperimentDetail/ExperimentDetail')) },
      { path: 'playground', lazy: lazyPage(() => import('@/pages/PlaygroundHome/PlaygroundHome')) },
      { path: 'studio', lazy: lazyPage(() => import('@/pages/CreativeStudio/CreativeStudio')) },
      { path: 'prompt-generator', lazy: lazyPage(() => import('@/pages/PromptGenerator/PromptGenerator')) },
      { path: 'prompt-generator/:experimentId', lazy: lazyPage(() => import('@/pages/PromptGenerator/PromptGenerator')) },
      { path: 'prompts', lazy: lazyPage(() => import('@/pages/PromptLibrary/PromptLibrary')) },
      { path: 'prompts/:promptId', lazy: lazyPage(() => import('@/pages/PromptDetail/PromptDetail')) },
      { path: 'works', lazy: lazyPage(() => import('@/pages/MyWorks/MyWorks')) },
      { path: 'works/:workId', lazy: lazyPage(() => import('@/pages/WorkDetail/WorkDetail')) },
      { path: 'settings', lazy: lazyPage(() => import('@/pages/Settings/Settings')) },
      { path: '*', lazy: lazyPage(() => import('@/pages/NotFound/NotFound')) },
    ],
  },
  {
    element: <PlaygroundLayout />,
    children: [
      { path: 'playground/:experimentId', lazy: lazyPage(() => import('@/pages/Playground/Playground')) },
      { path: 'studio/remix/:remixId', lazy: lazyPage(() => import('@/pages/RemixStudio/RemixStudio')) },
    ],
  },
])
