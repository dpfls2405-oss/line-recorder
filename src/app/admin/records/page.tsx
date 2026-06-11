'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const ML: Record<string,string> = { quick:'불량', lot:'로트' }
const MC: Record<string,string> = { quick:'bg-amber-100 text-amber-800', lot:'bg-blue-100 text-blue-800' }

function yieldColor(pct:number){ return pct>=95?'text-green-700':pct>=85?'text-amber-600':'text-red-600' }

export default function AdminRecords() {
  const [records,setRecords]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [selRecord,setSelRecord]=useState<any>(null)
  const [dateFrom,setDateFrom]=useState(()=>{ const d=new Date(); d.setDate(d.getDate()-6); return d.toISOString().slice(0,10) })
  const [dateTo,setDateTo]=useState(()=>new Date().toISOString().slice(0,10))
  const [filterLine,setFilterLine]=useState('ALL')
  const [filterItem,setFilterItem]=useState('ALL')
  const [filterPhoto,setFilterPhoto]=useState(false)

  useEffect(()=>{ load() },[dateFrom,dateTo,filterLine,filterItem,filterPhoto])

  async function load() {
    setLoading(true)
    let q=supabase.from('line_records').select('*').gte('recorded_at',dateFrom+'T00:00:00').lte('recorded_at',dateTo+'T23:59:59').order('recorded_at',{ascending:false})
    if(filterLine!=='ALL') q=q.eq('production_line',filterLine)
    if(filterItem!=='ALL') q=q.eq('item_code',filterItem)
    if(filterPhoto) q=q.not('photo_urls','is',null)
    const { data }=await q.limit(200)
    setRecords(data??[]); setLoading(false)
  }

  const allLines=Array.from(new Set(records.map(r=>r.production_line).filter(Boolean))).sort()
  const allItems=Array.from(new Set(records.map(r=>r.item_code).filter(Boolean))).sort()

  const selPhotos=selRecord?.photo_urls
    ?selRecord.photo_urls.split(',').map((u:string)=>u.trim()).filter(Boolean):[]

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-medium text-gray-900">기록 목록</h1>

      {/* 필터 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div><label className="block text-xs text-gray-500 mb-1">시작일</label>
            <input type="date" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-700" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">종료일</label>
            <input type="date" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-700" value={dateTo} onChange={e=>setDateTo(e.target.value)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">라인</label>
            <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none bg-white" value={filterLine} onChange={e=>setFilterLine(e.target.value)}>
              <option value="ALL">전체</option>{allLines.map(l=><option key={l}>{l}</option>)}</select></div>
          <div><label className="block text-xs text-gray-500 mb-1">품목코드</label>
            <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none bg-white" value={filterItem} onChange={e=>setFilterItem(e.target.value)}>
              <option value="ALL">전체</option>{allItems.map(i=><option key={i}>{i}</option>)}</select></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={filterPhoto} onChange={e=>setFilterPhoto(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-600">사진 있는 기록만</span>
          </label>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">전체 {records.length}건</h2>
        </div>
        {loading?(
          <div className="text-center py-10 text-gray-400 text-sm">불러오는 중...</div>
        ):records.length===0?(
          <div className="text-center py-10 text-gray-400 text-sm">데이터 없음</div>
        ):(
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">시각</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">모드</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">라인</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">품목코드/색상</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">투입</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">양품</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">불량</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">수율</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">사진</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500">불량유형</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map(r=>{
                const t=new Date(r.recorded_at)
                const yld=r.yield_pct
                const pList=r.photo_urls?r.photo_urls.split(',').map((u:string)=>u.trim()).filter(Boolean):[]
                return (
                  <tr key={r.id} onClick={()=>setSelRecord(r)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors">
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                      {t.toLocaleDateString('ko-KR',{month:'short',day:'numeric'})} {t.getHours().toString().padStart(2,'0')}:{t.getMinutes().toString().padStart(2,'0')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MC[r.mode]??'bg-gray-100 text-gray-600'}`}>{ML[r.mode]??r.mode}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{r.production_line}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{r.item_code} / {r.color_code}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{r.input_qty??'-'}</td>
                    <td className="px-4 py-2.5 text-right text-green-700 font-medium">{r.good_qty??'-'}</td>
                    <td className="px-4 py-2.5 text-right text-red-600">{r.defect_qty??'-'}</td>
                    <td className={`px-4 py-2.5 text-right font-bold ${yld!=null?yieldColor(parseFloat(yld)):'text-gray-400'}`}>
                      {yld!=null?`${parseFloat(yld).toFixed(1)}%`:'-'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {pList.length>0?(
                        <div className="flex items-center justify-center gap-1">
                          {pList.slice(0,2).map((url:string,i:number)=>(
                            <div key={i} className="w-8 h-8 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="" className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                            </div>
                          ))}
                          {pList.length>2&&<span className="text-xs text-gray-400">+{pList.length-2}</span>}
                        </div>
                      ):<span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.defect_types&&<span className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">{r.defect_types}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 사진 모달 */}
      {selRecord&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)'}}>
          <div className="absolute inset-0" onClick={()=>setSelRecord(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-y-auto shadow-2xl" style={{maxHeight:'85vh'}}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MC[selRecord.mode]??'bg-gray-100 text-gray-600'}`}>{ML[selRecord.mode]??selRecord.mode}</span>
                    <span className="font-medium">{selRecord.production_line}</span>
                  </div>
                  <p className="text-sm font-mono text-gray-500">{selRecord.item_code} / {selRecord.color_code}</p>
                  {selRecord.item_name&&<p className="text-xs text-gray-400 mt-0.5">{selRecord.item_name}</p>}
                  <p className="text-xs text-gray-300 mt-0.5">{new Date(selRecord.recorded_at).toLocaleString('ko-KR',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
                </div>
                <button onClick={()=>setSelRecord(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg flex-shrink-0">×</button>
              </div>

              {/* 수치 */}
              {(selRecord.input_qty!=null||selRecord.good_qty!=null||selRecord.defect_qty!=null)&&(
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {selRecord.input_qty!=null&&<div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-xl font-medium">{selRecord.input_qty}</div><div className="text-xs text-gray-400">투입</div></div>}
                  {selRecord.good_qty!=null&&<div className="bg-green-50 rounded-xl p-3 text-center"><div className="text-xl font-medium text-green-700">{selRecord.good_qty}</div><div className="text-xs text-gray-400">양품</div></div>}
                  {selRecord.defect_qty!=null&&<div className={`rounded-xl p-3 text-center ${selRecord.defect_qty>0?'bg-red-50':'bg-gray-50'}`}><div className={`text-xl font-medium ${selRecord.defect_qty>0?'text-red-600':'text-gray-500'}`}>{selRecord.defect_qty}</div><div className="text-xs text-gray-400">불량</div></div>}
                  {selRecord.yield_pct!=null&&<div className="bg-blue-50 rounded-xl p-3 text-center"><div className={`text-xl font-bold ${yieldColor(parseFloat(selRecord.yield_pct))}`}>{parseFloat(selRecord.yield_pct).toFixed(1)}%</div><div className="text-xs text-gray-400">수율</div></div>}
                </div>
              )}

              {/* 상세 */}
              <div className="space-y-2 mb-4 text-sm">
                {selRecord.defect_types&&<div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">불량유형</span><span className="text-red-600 font-medium">{selRecord.defect_types}</span></div>}
                {selRecord.defect_materials&&<div className="flex justify-between items-start py-1.5 border-b border-gray-50 gap-4"><span className="text-gray-400 flex-shrink-0">불량자재</span><span className="text-xs text-orange-600 text-right">{selRecord.defect_materials}</span></div>}
                {selRecord.st_seconds!=null&&<div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">ST</span><span className="font-mono">{Math.floor(selRecord.st_seconds/60)}분 {Math.round(selRecord.st_seconds%60)}초 ({selRecord.st_seconds}초)</span></div>}
                {selRecord.memo&&<div className="flex justify-between items-start py-1.5 gap-4"><span className="text-gray-400 flex-shrink-0">메모</span><span className="text-gray-600 text-right">{selRecord.memo}</span></div>}
              </div>

              {/* 사진 */}
              {selPhotos.length>0?(
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">불량 사진 {selPhotos.length}장</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selPhotos.map((url:string,i:number)=>(
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="block aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`사진 ${i+1}`} className="w-full h-full object-cover"
                          onError={e=>{(e.target as HTMLImageElement).closest('a')!.style.display='none'}} />
                      </a>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">사진 클릭 시 원본 열림 ↗</p>
                </div>
              ):(
                <div className="text-center py-6 text-gray-300"><div className="text-3xl mb-2">📷</div><p className="text-sm">첨부 사진 없음</p></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
