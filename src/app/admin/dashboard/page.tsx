'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function yieldColor(pct:number){ return pct>=95?'text-green-700':pct>=85?'text-amber-600':'text-red-600' }
function yieldBg(pct:number){ return pct>=95?'bg-green-600':pct>=85?'bg-amber-500':'bg-red-500' }

export default function AdminDashboard() {
  const [records,setRecords]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [dateFrom,setDateFrom]=useState(()=>{ const d=new Date(); d.setDate(d.getDate()-6); return d.toISOString().slice(0,10) })
  const [dateTo,setDateTo]=useState(()=>new Date().toISOString().slice(0,10))
  const [filterItem,setFilterItem]=useState('ALL')
  const [filterLine,setFilterLine]=useState('ALL')
  const [groupBy,setGroupBy]=useState<'item'|'line'|'date'>('item')

  useEffect(()=>{ loadRecords() },[dateFrom,dateTo,filterItem,filterLine])

  async function loadRecords() {
    setLoading(true)
    let q=supabase.from('line_records').select('*')
      .gte('recorded_at',dateFrom+'T00:00:00').lte('recorded_at',dateTo+'T23:59:59')
      .not('input_qty','is',null).order('recorded_at',{ascending:false})
    if(filterItem!=='ALL') q=q.eq('item_code',filterItem)
    if(filterLine!=='ALL') q=q.eq('production_line',filterLine)
    const { data }=await q; setRecords(data??[]); setLoading(false)
  }

  const grouped: Record<string,{input:number;good:number;defect:number;defect_types:Record<string,number>}>={}
  records.forEach(r=>{
    let key=groupBy==='item'?`${r.item_code} / ${r.color_code}`:groupBy==='line'?(r.production_line??'미지정'):new Date(r.recorded_at).toLocaleDateString('ko-KR')
    if(!grouped[key]) grouped[key]={input:0,good:0,defect:0,defect_types:{}}
    grouped[key].input+=r.input_qty??0; grouped[key].good+=r.good_qty??0; grouped[key].defect+=r.defect_qty??0
    if(r.defect_types) r.defect_types.split(',').forEach((t:string)=>{ const k=t.trim(); if(k) grouped[key].defect_types[k]=(grouped[key].defect_types[k]??0)+1 })
  })

  const dateRows: Record<string,{input:number;good:number;defect:number}>={}
  records.forEach(r=>{ const d=new Date(r.recorded_at).toLocaleDateString('ko-KR'); if(!dateRows[d])dateRows[d]={input:0,good:0,defect:0}; dateRows[d].input+=r.input_qty??0; dateRows[d].good+=r.good_qty??0; dateRows[d].defect+=r.defect_qty??0 })

  const totals=records.reduce((acc,r)=>({input:acc.input+(r.input_qty??0),good:acc.good+(r.good_qty??0),defect:acc.defect+(r.defect_qty??0)}),{input:0,good:0,defect:0})
  const totalYield=totals.input>0?(totals.good/totals.input*100):0
  const allItems=Array.from(new Set(records.map(r=>r.item_code).filter(Boolean))).sort()
  const allLines=Array.from(new Set(records.map(r=>r.production_line).filter(Boolean))).sort()

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-medium text-gray-900">생산 현황</h1>
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div><label className="block text-xs text-gray-500 mb-1">시작일</label>
            <input type="date" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-700" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">종료일</label>
            <input type="date" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-700" value={dateTo} onChange={e=>setDateTo(e.target.value)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">품목코드</label>
            <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none bg-white" value={filterItem} onChange={e=>setFilterItem(e.target.value)}>
              <option value="ALL">전체</option>{allItems.map(p=><option key={p}>{p}</option>)}</select></div>
          <div><label className="block text-xs text-gray-500 mb-1">라인</label>
            <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none bg-white" value={filterLine} onChange={e=>setFilterLine(e.target.value)}>
              <option value="ALL">전체</option>{allLines.map(l=><option key={l}>{l}</option>)}</select></div>
          <div className="flex gap-2">
            {[['item','품목별'],['line','라인별'],['date','날짜별']].map(([k,l])=>(
              <button key={k} onClick={()=>setGroupBy(k as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${groupBy===k?'bg-gray-900 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[{label:'총 투입',value:totals.input.toLocaleString(),unit:'개',color:'text-gray-900'},
          {label:'총 양품',value:totals.good.toLocaleString(),unit:'개',color:'text-green-700'},
          {label:'총 불량',value:totals.defect.toLocaleString(),unit:'개',color:'text-red-600'},
          {label:'평균 수율',value:totalYield.toFixed(1),unit:'%',color:yieldColor(totalYield)}].map(c=>(
          <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className={`text-2xl font-medium ${c.color}`}>{c.value}<span className="text-sm ml-0.5">{c.unit}</span></div>
            <div className="text-xs text-gray-400 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100"><h2 className="text-sm font-medium text-gray-900">{groupBy==='item'?'품목코드/색상별':groupBy==='line'?'라인별':'날짜별'} 집계</h2></div>
        {loading?<div className="text-center py-10 text-gray-400 text-sm">불러오는 중...</div>
        :Object.keys(grouped).length===0?<div className="text-center py-10 text-gray-400 text-sm">데이터 없음</div>:(
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">구분</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">투입</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">양품</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">불량</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">수율</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500 w-28">수율 바</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500">불량 유형</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Object.entries(grouped).sort((a,b)=>b[1].input-a[1].input).map(([key,s])=>{
                const yld=s.input>0?(s.good/s.input*100):0
                const top=Object.entries(s.defect_types).sort((a,b)=>b[1]-a[1]).slice(0,3)
                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 font-mono text-xs">{key}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{s.input.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-700 font-medium">{s.good.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-red-600">{s.defect.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-bold ${yieldColor(yld)}`}>{yld.toFixed(1)}%</td>
                    <td className="px-4 py-3"><div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${yieldBg(yld)}`} style={{width:`${Math.min(100,yld)}%`}} /></div></td>
                    <td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{top.map(([t,n])=><span key={t} className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">{t} {n}</span>)}</div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100"><h2 className="text-sm font-medium text-gray-900">날짜별 실 투입 수량</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">날짜</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">투입</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">양품</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">불량</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">수율</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {Object.entries(dateRows).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,s])=>{
              const yld=s.input>0?(s.good/s.input*100):0
              return (<tr key={date} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-700">{date}</td>
                <td className="px-4 py-2.5 text-right text-gray-600">{s.input.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-green-700">{s.good.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right text-red-600">{s.defect.toLocaleString()}</td>
                <td className={`px-4 py-2.5 text-right font-bold ${yieldColor(yld)}`}>{yld.toFixed(1)}%</td>
              </tr>)
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
