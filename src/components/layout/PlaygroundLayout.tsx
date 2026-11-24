import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { PageLoader } from '@/components/common/PageLoader'

/** Immersive full-viewport layout for the Live Playground and Remix Studio. */
export function PlaygroundLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ink-950">
      <Suspense fallback={<PageLoader full />}>
        <Outlet />
      </Suspense>
    </div>
  )
}
