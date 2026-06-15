'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function yieldColor(pct:number){ return pct>=95?'text-green-700':pct>=85?'text-amber-600':'text-red-600' }
function yieldBg(pct:number){ return pct>=95?'bg-green-600':pct>=85?'bg-amber-500':'bg-red-500' }
const ML: Record<string,string> = { quick:'불량', lot:'로트' }
const MC: Record<string,string> = { quick:'bg-amber-100 text-amber-800', lot:'bg-blue-100 text-blue-800' }

export default function AdminDashboard() {
  const [tab, setTab] = useState<'stats'|'list'>('stats')
  const [records,setRecords]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [dateFrom,setDateFrom]=useState(()=>{ const d=new Date(); d.setDate(d.getDate()-6); return d.toISOString().slice(0,10) })
  const [dateTo,setDateTo]=useState(()=>new Date().toISOString().slice(0,10))
  const [filterItem,setFilterItem]=useState('ALL')
  const [filterLine,setFilterLine]=useState('ALL')
  const [groupBy,setGroupBy]=useState<'item'|'line'|'date'>('item')
  // 기록 목록 전용
  const [filterPhoto,setFilterPhoto]=useState(false)
  const [selRecord,setSelRecord]=useState<any>(null)

  useEffect(()=>{ loadRecords() },[dateFrom,dateTo,filterItem,filterLine,filterPhoto,tab])

  async function loadRecords() {
    setLoading(true)
    let q=supabase.from('line_records').select('*')
      .gte('recorded_at',dateFrom+'T00:00:00').lte('recorded_at',dateTo+'T23:59:59')
      .order('recorded_at',{ascending:false})
    if(tab==='stats') q=q.not('input_qty','is',null)
    if(filterItem!=='ALL') q=q.eq('item_code',filterItem)
    if(filterLine!=='ALL') q=q.eq('production_line',filterLine)
    if(tab==='list'&&filterPhoto) q=q.not('photo_urls','is',null)
    const { data }=await q.limit(500)
    setRecords(data??[]); setLoading(false)
  }

  const allItems=Array.from(new Set(records.map(r=>r.item_code).filter(Boolean))).sort()
  const allLines=Array.from(new Set(records.map(r=>r.production_line).filter(Boolean))).sort()

  // 집계
  const grouped: Record<string,{input:number;good:number;defect:number;defect_types:Record<string,number>}>={}
  records.forEach(r=>{
    const key=groupBy==='item'?`${r.item_code} / ${r.color_code}`:groupBy==='line'?(r.production_line??'미지정'):new Date(r.recorded_at).toLocaleDateString('ko-KR')
    if(!grouped[key]) grouped[key]={input:0,good:0,defect:0,defect_types:{}}
    grouped[key].input+=r.input_qty??0; grouped[key].good+=r.good_qty??0; grouped[key].defect+=r.defect_qty??0
    if(r.defect_types) r.defect_types.split(',').forEach((t:string)=>{ const k=t.trim(); if(k) grouped[key].defect_types[k]=(grouped[key].defect_types[k]??0)+1 })
  })
  const dateRows: Record<string,{input:number;good:number;defect:number}>={}
  records.forEach(r=>{ const d=new Date(r.recorded_at).toLocaleDateString('ko-KR'); if(!dateRows[d])dateRows[d]={input:0,good:0,defect:0}; dateRows[d].input+=r.input_qty??0; dateRows[d].good+=r.good_qty??0; dateRows[d].defect+=r.defect_qty??0 })
  const totals=records.reduce((acc,r)=>({input:acc.input+(r.input_qty??0),good:acc.good+(r.good_qty??0),defect:acc.defect+(r.defect_qty??0)}),{input:0,good:0,defect:0})
  const totalYield=totals.input>0?(totals.good/totals.input*100):0

  const selPhotos=selRecord?.photo_urls?selRecord.photo_urls.split(',').map((u:string)=>u.trim()).filter(Boolean):[]

  // 공통 필터 UI
  const FilterBar = () => (
    <div className="bg-white rounded-xl p-4 shadow-sm mb-5">
      <div className="flex flex-wrap gap-4 items-end">
        <div><label className="block text-xs text-gray-500 mb-1">시작일</label>
          <input type="date" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-700" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} /></div>
        <div><label className="block text-xs text-gray-500 mb-1">종료일</label>
          <input type="date" className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green-700" value={dateTo} onChange={e=>setDateTo(e.target.value)} /></div>
        <div><label className="block text-xs text-gray-500 mb-1">라인</label>
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none bg-white min-w-[140px]" value={filterLine} onChange={e=>setFilterLine(e.target.value)}>
            <option value="ALL">전체</option>{allLines.map(l=><option key={l}>{l}</option>)}</select></div>
        <div><label className="block text-xs text-gray-500 mb-1">품목코드</label>
          <select className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none bg-white min-w-[180px]" value={filterItem} onChange={e=>setFilterItem(e.target.value)}>
            <option value="ALL">전체</option>{allItems.map(p=><option key={p}>{p}</option>)}</select></div>
        {tab==='stats'&&(
          <div className="flex gap-2 ml-auto">
            {(['item','품목별'],['line','라인별'],['date','날짜별']) && [['item','품목별'],['line','라인별'],['date','날짜별']].map(([k,l])=>(
              <button key={k} onClick={()=>setGroupBy(k as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${groupBy===k?'bg-gray-900 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l}</button>
            ))}
          </div>
        )}
        {tab==='list'&&(
          <label className="flex items-center gap-2 cursor-pointer ml-auto">
            <input type="checkbox" checked={filterPhoto} onChange={e=>setFilterPhoto(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-600">사진 있는 기록만</span>
          </label>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* 탭 헤더 */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-0">
        {[['stats','생산 현황'],['list','기록 목록']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k as any)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab===k?'border-green-700 text-green-700':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 pb-2">{records.length}건</span>
      </div>

      <FilterBar />

      {/* ── 생산 현황 탭 ── */}
      {tab==='stats'&&(<>
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
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-900">{groupBy==='item'?'품목코드/색상별':groupBy==='line'?'라인별':'날짜별'} 집계</h2>
          </div>
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
                  <th className="px-4 py-2.5 text-xs font-medium text-gray-500 w-36">수율 바</th>
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
      </>)}

      {/* ── 기록 목록 탭 ── */}
      {tab==='list'&&(
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-900">전체 {records.length}건</h2>
          </div>
          {loading?<div className="text-center py-10 text-gray-400 text-sm">불러오는 중...</div>
          :records.length===0?<div className="text-center py-10 text-gray-400 text-sm">데이터 없음</div>:(
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 whitespace-nowrap">시각</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">모드</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">라인</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">품목코드 / 부품명</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">투입</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">양품</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">불량</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">수율</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">ST</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">사진</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">불량유형</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(r=>{
                  const t=new Date(r.recorded_at)
                  const yld=r.yield_pct
                  const pList=r.photo_urls?r.photo_urls.split(',').map((u:string)=>u.trim()).filter(Boolean):[]
                  return (
                    <tr key={r.id} onClick={()=>setSelRecord(r)} className="hover:bg-blue-50 cursor-pointer transition-colors">
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                        {t.toLocaleDateString('ko-KR',{month:'short',day:'numeric'})} {t.getHours().toString().padStart(2,'0')}:{t.getMinutes().toString().padStart(2,'0')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MC[r.mode]??'bg-gray-100 text-gray-600'}`}>{ML[r.mode]??r.mode}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap text-xs">{r.production_line}</td>
                      <td className="px-4 py-2.5 text-xs">
                        <div className="font-mono text-gray-600">{r.item_code} / {r.color_code}</div>
                        {r.item_name&&<div className="text-gray-400 mt-0.5 truncate max-w-[220px]">{r.item_name}</div>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{r.input_qty??'-'}</td>
                      <td className="px-4 py-2.5 text-right text-green-700 font-medium">{r.good_qty??'-'}</td>
                      <td className="px-4 py-2.5 text-right text-red-600">{r.defect_qty??'-'}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${yld!=null?yieldColor(parseFloat(yld)):'text-gray-400'}`}>
                        {yld!=null?`${parseFloat(yld).toFixed(1)}%`:'-'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {r.st_seconds!=null?`${Math.floor(r.st_seconds/60)}′${Math.round(r.st_seconds%60).toString().padStart(2,'0')}″`:'-'}
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
                        ):<span className="text-gray-300 text-xs">-</span>}
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
      )}

      {/* 상세 모달 */}
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
              {(selRecord.input_qty!=null||selRecord.good_qty!=null||selRecord.defect_qty!=null)&&(
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {selRecord.input_qty!=null&&<div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-xl font-medium">{selRecord.input_qty}</div><div className="text-xs text-gray-400">투입</div></div>}
                  {selRecord.good_qty!=null&&<div className="bg-green-50 rounded-xl p-3 text-center"><div className="text-xl font-medium text-green-700">{selRecord.good_qty}</div><div className="text-xs text-gray-400">양품</div></div>}
                  {selRecord.defect_qty!=null&&<div className={`rounded-xl p-3 text-center ${selRecord.defect_qty>0?'bg-red-50':'bg-gray-50'}`}><div className={`text-xl font-medium ${selRecord.defect_qty>0?'text-red-600':'text-gray-500'}`}>{selRecord.defect_qty}</div><div className="text-xs text-gray-400">불량</div></div>}
                  {selRecord.yield_pct!=null&&<div className="bg-blue-50 rounded-xl p-3 text-center"><div className={`text-xl font-bold ${yieldColor(parseFloat(selRecord.yield_pct))}`}>{parseFloat(selRecord.yield_pct).toFixed(1)}%</div><div className="text-xs text-gray-400">수율</div></div>}
                </div>
              )}
              <div className="space-y-1.5 mb-4 text-sm">
                {selRecord.defect_types&&<div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">불량유형</span><span className="text-red-600 font-medium">{selRecord.defect_types}</span></div>}
                {selRecord.defect_materials&&<div className="flex justify-between items-start py-1.5 border-b border-gray-50 gap-4"><span className="text-gray-400 flex-shrink-0">불량자재</span><span className="text-xs text-orange-600 text-right">{selRecord.defect_materials}</span></div>}
                {selRecord.st_seconds!=null&&<div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">ST</span><span className="font-mono">{Math.floor(selRecord.st_seconds/60)}분 {Math.round(selRecord.st_seconds%60)}초 ({selRecord.st_seconds}초)</span></div>}
                {selRecord.video_url&&(()=>{
                  let vlist:{url:string;desc:string}[]=[]
                  try{ vlist=JSON.parse(selRecord.video_url) }catch{ vlist=[{url:selRecord.video_url,desc:''}] }
                  return(<div className="py-1.5 border-b border-gray-50">
                    <span className="text-gray-400 text-sm">동영상</span>
                    <div className="mt-1 space-y-1">
                      {vlist.map((v,i)=>(
                        <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-2 py-1.5 bg-red-50 rounded-lg text-xs text-red-600 font-medium">
                          <span>▶</span><span>{v.desc||`영상 ${i+1}`}</span><span className="ml-auto opacity-60">↗</span>
                        </a>
                      ))}
                    </div>
                  </div>)
                })()}
                {selRecord.memo&&<div className="flex justify-between items-start py-1.5 gap-4"><span className="text-gray-400 flex-shrink-0">메모</span><span className="text-gray-600 text-right">{selRecord.memo}</span></div>}
              </div>
              {selPhotos.length>0?(
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">사진 {selPhotos.length}장</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selPhotos.map((url:string,i:number)=>(
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`사진 ${i+1}`} className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).closest('a')!.style.display='none'}} />
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
