'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
const NAV = [
  { href:'/admin/dashboard', label:'생산 현황 / 기록' },
  { href:'/admin/import',    label:'데이터 가져오기' },
  { href:'/admin/materials', label:'자재코드' },
  { href:'/admin/plans',     label:'계획 관리' },
]
export default function AdminLayout({ children }: { children:React.ReactNode }) {
  const pathname=usePathname(); const router=useRouter()
  useEffect(()=>{ if(pathname!=='/admin'&&typeof sessionStorage!=='undefined'&&!sessionStorage.getItem('admin_ok')) router.push('/admin') },[pathname])
  if(pathname==='/admin') return <>{children}</>
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white h-12 flex items-center px-4 gap-4">
        <span className="text-sm font-medium text-gray-200 flex-shrink-0">관리자</span>
        <nav className="flex gap-1 flex-1 overflow-x-auto">
          {NAV.map(n=>(
            <Link key={n.href} href={n.href}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${pathname===n.href?'bg-white/20 text-white':'text-gray-400 hover:text-white hover:bg-white/10'}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="text-xs text-gray-400 hover:text-white whitespace-nowrap flex-shrink-0">← 라인 화면</Link>
        <a href="https://heartfelt-meringue-fe8c54.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap flex-shrink-0">🔧 가공일지 ↗</a>
        <a href="https://docs.google.com/spreadsheets/d/1iCLPKvleI_OvbjQh9t2ZffmRWKzEpCkA-stQ_BKKUkk/edit?gid=0#gid=0"
          target="_blank" rel="noopener noreferrer"
          className="text-xs text-green-400 hover:text-green-300 whitespace-nowrap flex-shrink-0">📊 데이터 시트 ↗</a>
      </header>
      <main className="w-full max-w-screen-2xl mx-auto px-6 py-5">{children}</main>
    </div>
  )
}
