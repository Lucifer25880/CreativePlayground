import { Link } from 'react-router-dom'
import { Icon } from '@/components/common/Icon'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-gradient text-7xl font-bold">404</div>
      <h1 className="text-xl font-semibold text-white">页面不存在</h1>
      <p className="text-sm text-slate-400">你访问的页面可能已被移动或删除。</p>
      <Link to="/" className="btn-primary mt-2">
        <Icon name="home" size={16} /> Back to Home
      </Link>
    </div>
  )
}
