import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'
import { PageLoader } from '@/components/common/PageLoader'

export function AppLayout() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      {pathname !== '/' && <Footer />}
    </div>
  )
}
