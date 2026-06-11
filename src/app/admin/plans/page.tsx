'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPlans() {
  const [plans, setPlans] = useState<any[]>([])
  const [totals, setTotals] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all'|'active'|'completed'>('active')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: planData } = await supabase
      .from('production_plans')
      .select('*')
      .order('pack_plan_date', { ascending: false })

    const { data: records } = await supabase
      .from('line_records')
      .select('plan_id, good_qty')
      .eq('mode', 'lot')
      .not('plan_id', 'is', null)

    const totalMap: Record<string, number> = {}
    ;(records ?? []).forEach((r: any) => {
      if (r.plan_id) totalMap[r.plan_id] = (totalMap[r.plan_id] ?? 0) + (r.good_qty ?? 0)
    })

    setPlans(planData ?? [])
    setTotals(totalMap)
    setLoading(false)
  }

  async function toggleStatus(plan: any) {
    const next = plan.status === 'completed' ? 'active' : 'completed'
    await supabase.from('production_plans').update({ status: next }).eq('id', plan.id)
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: next } : p))
  }

  const filtered = plans.filter(p =>
    filterStatus === 'all' ? true : p.status === filterStatus
  )

  const activeCount = plans.filter(p => p.status !== 'completed').length
  const completedCount = plans.filter(p => p.status === 'completed').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-gray-900">투입 계획 관리</h1>
        <div className="flex gap-2 text-xs">
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">진행중 {activeCount}</span>
          <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">완료 {completedCount}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm flex gap-2">
        {(['active','all','completed'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus===s?'bg-gray-900 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s==='all'?'전체':s==='active'?'진행중':'완료'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">데이터 없음</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">품목코드 / 색상</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">계획일</th>
                <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500">계획 / 누적</th>
                <th className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 w-28">완료 처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => {
                const cumGood = totals[p.id] ?? 0
                const pct = p.plan_qty > 0 ? Math.round(cumGood / p.plan_qty * 100) : 0
                const isOver = cumGood >= p.plan_qty
                return (
                  <tr key={p.id} className={p.status==='completed'?'bg-gray-50 opacity-60':''}>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{p.item_code} / {p.color_code}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{p.pack_plan_date}</td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className={`font-medium text-sm ${isOver?'text-green-700':'text-gray-700'}`}>{cumGood}</span>
                      <span className="text-gray-400 text-xs"> / {p.plan_qty}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ml-1 ${isOver?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{pct}%</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => toggleStatus(p)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                          p.status==='completed'
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}>
                        {p.status === 'completed' ? '↩ 복구' : '✅ 완료 처리'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
