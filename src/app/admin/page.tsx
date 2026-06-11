'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function AdminLoginPage() {
  const router=useRouter(); const [pw,setPw]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false)
  async function handleLogin(e:React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const res=await fetch('/api/admin-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})})
    const data=await res.json()
    if(data.ok){ sessionStorage.setItem('admin_ok','1'); router.push('/admin/dashboard') }
    else setError('비밀번호가 올바르지 않습니다.')
    setLoading(false)
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-xs shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-3 text-white text-xl">⚙</div>
          <h1 className="text-lg font-medium">관리자</h1>
          <p className="text-xs text-gray-400 mt-1">생산 데이터 관리</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">관리자 비밀번호</label>
            <input type="password" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-700"
              value={pw} onChange={e=>setPw(e.target.value)} required />
          </div>
          {error&&<p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium disabled:bg-gray-400">
            {loading?'확인 중...':'로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
