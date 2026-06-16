'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function yieldColor(pct:number){ return pct>=95?'text-green-700':pct>=85?'text-amber-600':'text-red-600' }
function yieldBg(pct:number){ return pct>=95?'bg-green-600':pct>=85?'bg-amber-500':'bg-red-500' }
const ML: Record<string,string> = { quick:'불량', lot:'로트' }
const MC: Record<string,string> = { quick:'bg-amber-100 text-amber-800', lot:'bg-blue-100 text-blue-800' }

function EditModal({ record, onClose, onSaved }: { record:any; onClose:()=>void; onSaved:(updated:any)=>void }) {
  const [form, setForm] = useState({
    production_line: record.production_line??'',
    item_code: record.item_code??'',
    color_code: record.color_code??'',
    item_name: record.item_name??'',
    input_qty: record.input_qty??'',
    good_qty: record.good_qty??'',
    defect_types: record.defect_types??'',
    defect_materials: record.defect_materials??'',
    memo: record.memo??'',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  function set(k: string, v: string) { setForm(f=>({...f,[k]:v})) }

  async function save() {
    setSaving(true); setErr('')
    const body: any = { id: record.id, ...form }
    if (form.input_qty!=='') body.input_qty = Number(form.input_qty)
    if (form.good_qty!=='') body.good_qty = Number(form.good_qty)
    const res = await fetch('/api/records', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
    const json = await res.json()
    setSaving(false)
    if (!json.ok) { setErr(json.error??'저장 실패'); return }
    const inp = Number(form.input_qty)||0; const good = Number(form.good_qty)||0
    onSaved({ ...record, ...form,
      input_qty: form.input_qty!==''?inp:record.input_qty,
      good_qty: form.good_qty!==''?good:record.good_qty,
      defect_qty: (form.input_qty!==''&&form.good_qty!=='') ? inp-good : record.defect_qty,
      yield_pct: (inp>0) ? ((good/inp)*100).toFixed(2) : record.yield_pct,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)'}}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-y-auto shadow-2xl" style={{maxHeight:'85vh'}}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold">기록 수정</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg">×</button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-gray-400 mb-1">생산라인</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                  value={form.production_line} onChange={e=>set('production_line',e.target.value)} /></div>
              <div><label className="block text-xs text-gray-400 mb-1">품목코드</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600 font-mono"
                  value={form.item_code} onChange={e=>set('item_code',e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-gray-400 mb-1">색상코드</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600 font-mono"
                  value={form.color_code} onChange={e=>set('color_code',e.target.value)} /></div>
              <div><label className="block text-xs text-gray-400 mb-1">부품명</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                  value={form.item_name} onChange={e=>set('item_name',e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-gray-400 mb-1">투입 수량</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                  value={form.input_qty} onChange={e=>set('input_qty',e.target.value)} /></div>
              <div><label className="block text-xs text-gray-400 mb-1">양품 수량</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                  value={form.good_qty} onChange={e=>set('good_qty',e.target.value)} /></div>
            </div>
            {(form.input_qty!==''&&form.good_qty!=='')&&(
              <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-500 flex gap-4">
                <span>불량 <b className="text-red-600">{Number(form.input_qty)-Number(form.good_qty)}</b></span>
                <span>수율 <b className={Number(form.input_qty)>0?((Number(form.good_qty)/Number(form.input_qty)*100)>=95?'text-green-700':'text-amber-600'):'text-gray-400'}>
                  {Number(form.input_qty)>0?((Number(form.good_qty)/Number(form.input_qty)*100).toFixed(1))+'%':'-'}
                </b></span>
              </div>
            )}
            <div><label className="block text-xs text-gray-400 mb-1">불량유형</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                value={form.defect_types} onChange={e=>set('defect_types',e.target.value)} placeholder="예: 재봉불량, 오염" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">불량자재</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                value={form.defect_materials} onChange={e=>set('defect_materials',e.target.value)} /></div>
            <div><label className="block text-xs text-gray-400 mb-1">메모</label>
              <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600 resize-none"
                rows={2} value={form.memo} onChange={e=>set('memo',e.target.value)} /></div>
          </div>
          {err&&<p className="text-xs text-red-500 mt-3 text-center">{err}</p>}
          <div className="flex gap-2 mt-5">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium">취소</button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-green-700 text-white text-sm font-semibold disabled:opacity-50">
              {saving?'저장 중...':'저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ record, onClose, onEdit }: { record:any; onClose:()=>void; onEdit:()=>void }) {
  const selPhotos = record?.photo_urls ? record.photo_urls.split(',').map((u:string)=>u.trim()).filter(Boolean) : []
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.75)'}}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-y-auto shadow-2xl" style={{maxHeight:'85vh'}}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MC[record.mode]??'bg-gray-100 text-gray-600'}`}>{ML[record.mode]??record.mode}</span>
                <span className="font-medium">{record.production_line}</span>
              </div>
              <p className="text-sm font-mono text-gray-500">{record.item_code} / {record.color_code}</p>
              {record.item_name&&<p className="text-xs text-gray-400 mt-0.5">{record.item_name}</p>}
              <p className="text-xs text-gray-300 mt-0.5">{new Date(record.recorded_at).toLocaleString('ko-KR',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-green-700 text-white text-xs font-medium">수정</button>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg">×</button>
            </div>
          </div>
          {(record.input_qty!=null||record.good_qty!=null||record.defect_qty!=null)&&(
            <div className="grid grid-cols-4 gap-2 mb-4">
              {record.input_qty!=null&&<div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-xl font-medium">{record.input_qty}</div><div className="text-xs text-gray-400">투입</div></div>}
              {record.good_qty!=null&&<div className="bg-green-50 rounded-xl p-3 text-center"><div className="text-xl font-medium text-green-700">{record.good_qty}</div><div className="text-xs text-gray-400">양품</div></div>}
              {record.defect_qty!=null&&<div className={`rounded-xl p-3 text-center ${record.defect_qty>0?'bg-red-50':'bg-gray-50'}`}><div className={`text-xl font-medium ${record.defect_qty>0?'text-red-600':'text-gray-500'}`}>{record.defect_qty}</div><div className="text-xs text-gray-400">불량</div></div>}
              {record.yield_pct!=null&&<div className="bg-blue-50 rounded-xl p-3 text-center"><div className={`text-xl font-bold ${yieldColor(parseFloat(record.yield_pct))}`}>{parseFloat(record.yield_pct).toFixed(1)}%</div><div className="text-xs text-gray-400">수율</div></div>}
            </div>
          )}
          <div className="space-y-1.5 mb-4 text-sm">
            {record.defect_types&&<div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">불량유형</span><span className="text-red-600 font-medium">{record.defect_types}</span></div>}
            {record.defect_materials&&<div className="flex justify-between items-start py-1.5 border-b border-gray-50 gap-4"><span className="text-gray-400 flex-shrink-0">불량자재</span><span className="text-xs text-orange-600 text-right">{record.defect_materials}</span></div>}
            {record.st_seconds!=null&&<div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">ST</span><span className="font-mono">{Math.floor(record.st_seconds/60)}분 {Math.round(record.st_seconds%60)}초 ({record.st_seconds}초)</span></div>}
            {record.video_url&&(()=>{
              let vlist:{url:string;desc:string}[]=[]
              try{ vlist=JSON.parse(record.video_url) }catch{ vlist=[{url:record.video_url,desc:''}] }
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
            {record.memo&&<div className="flex justify-between items-start py-1.5 gap-4"><span className="text-gray-400 flex-shrink-0">메모</span><span className="text-gray-600 text-right">{record.memo}</span></div>}
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
  )
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<'stats'|'list'>('stats')
  const [records,setRecords]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [dateFrom,setDateFrom]=useState(()=>{ const d=new Date(); d.setDate(d.getDate()-6); return d.toISOString().slice(0,10) })
  const [dateTo,setDateTo]=useState(()=>new Date().toISOString().slice(0,10))
  const [filterItem,setFilterItem]=useState('ALL')
  const [filterLine,setFilterLine]=useState('ALL')
  const [groupBy,setGroupBy]=useState<'item'|'line'|'date'>('item')
  const [filterPhoto,setFilterPhoto]=useState(false)
  const [selRecord,setSelRecord]=useState<any>(null)
  const [editRecord,setEditRecord]=useState<any>(null)

  useEffect(()=>{ loadRecords() },[dateFrom,dateTo,filterItem,filterLine,filterPhoto,tab])

  async function loadRecords() {
    setLoading(true)
    let q=supabase.from('line_records').select('*')
      .gte('recorded_at',dateFrom+'T00:00:00').lte('recorded_at',dateTo+'T23:59:59')
      .order('recorded_at',{ascending:false})
    if(filterItem!=='ALL') q=q.eq('item_code',filterItem)
    if(filterLine!=='ALL') q=q.eq('production_line',filterLine)
    if(tab==='list'&&filterPhoto) q=q.not('photo_urls','is',null)
    const { data }=await q.limit(500)
    setRecords(data??[]); setLoading(false)
  }

  function handleSaved(updated: any) {
    setRecords(rs => rs.map(r => r.id===updated.id ? updated : r))
    setSelRecord(updated)
  }

  const allItems=Array.from(new Set(records.map(r=>r.item_code).filter(Boolean))).sort()
  const allLines=Array.from(new Set(records.map(r=>r.production_line).filter(Boolean))).sort()

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

  return (
    <div className="space-y-4">
      {/* 탭 */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {[['stats','생산 현황'],['list','기록 목록']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k as any)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab===k?'border-green-700 text-green-700':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 pb-2">{records.length}건</span>
      </div>

      {/* 공통 필터 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
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
              {[['item','품목별'],['line','라인별'],['date','날짜별']].map(([k,l])=>(
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
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
                        <td className="px-4 py-3 font-medium text-gray-900 font-mono text-xs whitespace-nowrap">{key}</td>
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
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100"><h2 className="text-sm font-medium text-gray-900">날짜별 실 투입 수량</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
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
      </>)}

      {/* ── 기록 목록 탭 ── */}
      {tab==='list'&&(
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">전체 {records.length}건</h2>
            <span className="text-xs text-gray-400">행 클릭 → 상세보기 / 수정</span>
          </div>
          {loading?<div className="text-center py-10 text-gray-400 text-sm">불러오는 중...</div>
          :records.length===0?<div className="text-center py-10 text-gray-400 text-sm">데이터 없음</div>:(
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 whitespace-nowrap">시각</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">모드</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 whitespace-nowrap">라인</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">품목코드 / 부품명</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">투입</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">양품</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">불량</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">수율</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 whitespace-nowrap">ST</th>
                    <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">사진</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">불량유형</th>
                    <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">수정</th>
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
                          <div className="font-mono text-gray-600 whitespace-nowrap">{r.item_code} / {r.color_code}</div>
                          {r.item_name&&<div className="text-gray-400 mt-0.5 max-w-[200px] truncate">{r.item_name}</div>}
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
                        <td className="px-4 py-2.5 text-center" onClick={e=>{ e.stopPropagation(); setEditRecord(r) }}>
                          <button className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors font-medium">수정</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 상세 모달 */}
      {selRecord&&!editRecord&&(
        <DetailModal record={selRecord} onClose={()=>setSelRecord(null)} onEdit={()=>setEditRecord(selRecord)} />
      )}
      {/* 수정 모달 */}
      {editRecord&&(
        <EditModal record={editRecord} onClose={()=>setEditRecord(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}
