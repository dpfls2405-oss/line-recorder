'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const ML: Record<string,string> = { quick:'빠른불량', lot:'로트마감' }
const MC: Record<string,string> = { quick:'bg-amber-100 text-amber-800', lot:'bg-blue-100 text-blue-800' }

function toLocalDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

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
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{background:'rgba(0,0,0,0.75)'}}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl w-full max-w-lg overflow-y-auto" style={{maxHeight:'92vh'}}>
        <div className="p-5">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold">기록 수정</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg">×</button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">생산라인</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                  value={form.production_line} onChange={e=>set('production_line',e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">품목코드</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600 font-mono"
                  value={form.item_code} onChange={e=>set('item_code',e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">색상코드</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600 font-mono"
                  value={form.color_code} onChange={e=>set('color_code',e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">부품명</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                  value={form.item_name} onChange={e=>set('item_name',e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">투입 수량</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                  value={form.input_qty} onChange={e=>set('input_qty',e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">양품 수량</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                  value={form.good_qty} onChange={e=>set('good_qty',e.target.value)} />
              </div>
            </div>
            {(form.input_qty!==''&&form.good_qty!=='')&&(
              <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-500 flex gap-4">
                <span>불량 <b className="text-red-600">{Number(form.input_qty)-Number(form.good_qty)}</b></span>
                <span>수율 <b className={Number(form.input_qty)>0?((Number(form.good_qty)/Number(form.input_qty)*100)>=95?'text-green-700':'text-amber-600'):'text-gray-400'}>
                  {Number(form.input_qty)>0?((Number(form.good_qty)/Number(form.input_qty)*100).toFixed(1))+'%':'-'}
                </b></span>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-400 mb-1">불량유형</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                value={form.defect_types} onChange={e=>set('defect_types',e.target.value)} placeholder="예: 재봉불량, 오염" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">불량자재</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                value={form.defect_materials} onChange={e=>set('defect_materials',e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">메모</label>
              <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600 resize-none"
                rows={2} value={form.memo} onChange={e=>set('memo',e.target.value)} />
            </div>
          </div>

          {err&&<p className="text-xs text-red-500 mt-3 text-center">{err}</p>}

          <div className="flex gap-2 mt-5">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium">취소</button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-3 rounded-2xl bg-green-700 text-white text-sm font-semibold disabled:opacity-50">
              {saving?'저장 중...':'저장'}
            </button>
          </div>
          <div className="pb-4" />
        </div>
      </div>
    </div>
  )
}

function PhotoModal({ record, onClose, onEdit }: { record:any; onClose:()=>void; onEdit:()=>void }) {
  const photos = record.photo_urls
    ? record.photo_urls.split(',').map((u:string)=>u.trim()).filter(Boolean) : []
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{background:'rgba(0,0,0,0.75)'}}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl w-full max-w-lg overflow-y-auto" style={{maxHeight:'90vh'}}>
        <div className="p-5">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MC[record.mode]??'bg-gray-100 text-gray-600'}`}>{ML[record.mode]??record.mode}</span>
                <span className="text-sm font-medium">{record.production_line}</span>
              </div>
              <p className="text-xs font-mono text-gray-500">{record.item_code} / {record.color_code}</p>
              {record.item_name&&<p className="text-xs text-gray-400 mt-0.5">{record.item_name}</p>}
              <p className="text-xs text-gray-300 mt-0.5">{new Date(record.recorded_at).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={onEdit}
                className="px-3 py-1.5 rounded-xl bg-green-700 text-white text-xs font-medium">수정</button>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg">×</button>
            </div>
          </div>
          {(record.input_qty!=null||record.good_qty!=null||record.defect_qty!=null)&&(
            <div className="grid grid-cols-3 gap-2 mb-4">
              {record.input_qty!=null&&<div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-2xl font-medium">{record.input_qty}</div><div className="text-xs text-gray-400 mt-0.5">투입</div></div>}
              {record.good_qty!=null&&<div className="bg-green-50 rounded-xl p-3 text-center"><div className="text-2xl font-medium text-green-700">{record.good_qty}</div><div className="text-xs text-gray-400 mt-0.5">양품</div></div>}
              {record.defect_qty!=null&&<div className={`rounded-xl p-3 text-center ${record.defect_qty>0?'bg-red-50':'bg-gray-50'}`}><div className={`text-2xl font-medium ${record.defect_qty>0?'text-red-600':'text-gray-500'}`}>{record.defect_qty}</div><div className="text-xs text-gray-400 mt-0.5">불량</div></div>}
            </div>
          )}
          <div className="space-y-2 mb-4 text-sm">
            {record.yield_pct!=null&&<div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">수율</span><span className={`font-bold ${parseFloat(record.yield_pct)>=95?'text-green-700':parseFloat(record.yield_pct)>=85?'text-amber-600':'text-red-600'}`}>{parseFloat(record.yield_pct).toFixed(1)}%</span></div>}
            {record.defect_types&&<div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">불량유형</span><span className="text-red-600 font-medium">{record.defect_types}</span></div>}
            {record.defect_materials&&<div className="flex justify-between items-start py-1.5 border-b border-gray-50 gap-4"><span className="text-gray-400 flex-shrink-0">불량자재</span><span className="text-xs text-orange-600 text-right">{record.defect_materials}</span></div>}
            {record.st_seconds!=null&&<div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-gray-400">ST</span><span className="font-mono font-medium">{Math.floor(record.st_seconds/60)}분 {Math.round(record.st_seconds%60)}초 <span className="text-gray-400 text-xs">({record.st_seconds}초)</span></span></div>}
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
          {photos.length>0?(
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">불량 사진 {photos.length}장</p>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((url:string,i:number)=>(
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="block aspect-square rounded-2xl overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`사진 ${i+1}`} className="w-full h-full object-cover"
                      onError={e=>{(e.target as HTMLImageElement).closest('a')!.style.display='none'}} />
                  </a>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">사진 클릭 시 원본 열림 ↗</p>
            </div>
          ):(
            <div className="text-center py-6"><div className="text-4xl mb-2">📷</div><p className="text-sm text-gray-400">첨부 사진 없음</p></div>
          )}
          <div className="pb-4" />
        </div>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const router=useRouter()
  const [records,setRecords]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [filter,setFilter]=useState('today')
  const [selRecord,setSelRecord]=useState<any>(null)
  const [editRecord,setEditRecord]=useState<any>(null)
  const today = toLocalDateStr(new Date())
  const [dateFrom,setDateFrom]=useState(today)
  const [dateTo,setDateTo]=useState(today)
  const [lineFilter,setLineFilter]=useState('all')
  const [showDatePicker,setShowDatePicker]=useState(false)

  useEffect(()=>{ load() },[filter, dateFrom, dateTo])

  async function load() {
    setLoading(true)
    const params=new URLSearchParams({ filter })
    if(filter==='custom'){ params.set('dateFrom',dateFrom); params.set('dateTo',dateTo) }
    const res=await fetch(`/api/records?${params.toString()}`)
    const data=res.ok?await res.json():[]
    setRecords(data); setLoading(false)
  }

  function handleSaved(updated: any) {
    setRecords(rs => rs.map(r => r.id===updated.id ? updated : r))
    setSelRecord(updated)
  }

  const allLines = Array.from(new Set(records.map(r=>r.production_line||'미지정'))).sort()
  const filtered = lineFilter==='all' ? records : records.filter(r=>(r.production_line||'미지정')===lineFilter)

  const summary: Record<string,{input:number;good:number;defect:number}>= {}
  filtered.forEach(r=>{ const k=r.production_line||'미지정'; if(!summary[k])summary[k]={input:0,good:0,defect:0}; summary[k].input+=r.input_qty??0; summary[k].good+=r.good_qty??0; summary[k].defect+=r.defect_qty??0 })

  function applyCustomDate() {
    setFilter('custom')
    setShowDatePicker(false)
  }

  return (
    <div className="pb-8 min-h-screen bg-gray-100 max-w-md mx-auto">
      <div className="bg-green-800 text-white px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={()=>router.push('/')} className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white">←</button>
          <div><h1 className="text-base font-medium">기록 현황</h1><p className="text-xs text-green-200">{filtered.length}건</p></div>
        </div>
        <div className="flex gap-2 mb-2 flex-wrap">
          {[['today','오늘'],['week','7일'],['all','전체']].map(([k,l])=>(
            <button key={k} onClick={()=>{ setFilter(k); setShowDatePicker(false) }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium ${filter===k?'bg-white text-green-800':'bg-green-700/60 text-white'}`}>{l}</button>
          ))}
          <button onClick={()=>setShowDatePicker(v=>!v)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium ${filter==='custom'?'bg-white text-green-800':'bg-green-700/60 text-white'}`}>
            {filter==='custom'?`${dateFrom} ~ ${dateTo}`:'📅 날짜 선택'}
          </button>
        </div>
        {showDatePicker&&(
          <div className="bg-white rounded-2xl p-3 mb-2 text-gray-800">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">시작일</p>
                <input type="date" value={dateFrom} max={dateTo} onChange={e=>setDateFrom(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600" />
              </div>
              <span className="text-gray-400 mt-4">~</span>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">종료일</p>
                <input type="date" value={dateTo} min={dateFrom} max={today} onChange={e=>setDateTo(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600" />
              </div>
            </div>
            <button onClick={applyCustomDate}
              className="w-full mt-2 py-2 bg-green-700 text-white rounded-xl text-sm font-medium">조회</button>
          </div>
        )}
        {allLines.length>1&&(
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={()=>setLineFilter('all')}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${lineFilter==='all'?'bg-white text-green-800':'bg-green-700/40 text-green-100'}`}>
              전체 라인
            </button>
            {allLines.map(line=>(
              <button key={line} onClick={()=>setLineFilter(line)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${lineFilter===line?'bg-white text-green-800':'bg-green-700/40 text-green-100'}`}>
                {line}
              </button>
            ))}
          </div>
        )}
      </div>

      {Object.keys(summary).length>0&&(
        <div className="bg-white mx-3 mt-3 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">라인별 요약</p>
          <div className="space-y-2.5">
            {Object.entries(summary).map(([line,s])=>{ const yld=s.input>0?(s.good/s.input*100):0; const col=yld>=95?'text-green-700':yld>=85?'text-amber-600':'text-red-600'; const bar=yld>=95?'bg-green-600':yld>=85?'bg-amber-500':'bg-red-500'; return (
              <div key={line} className="flex items-center gap-2">
                <span className="text-xs font-medium w-24 truncate">{line}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${bar}`} style={{width:`${Math.min(100,yld)}%`}} /></div>
                <span className={`text-sm font-bold w-14 text-right ${col}`}>{yld.toFixed(1)}%</span>
                <span className="text-xs text-gray-400 w-14 text-right">불량 {s.defect}</span>
              </div>
            )})}
          </div>
        </div>
      )}

      {loading?(
        <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
      ):filtered.length===0?(
        <div className="text-center py-12 text-gray-400 text-sm">기록 없음</div>
      ):(
        <div className="space-y-2 mt-3 mx-3">
          {filtered.map(r=>{
            const yld=r.yield_pct; const yCol=yld!=null?(yld>=95?'text-green-700':yld>=85?'text-amber-600':'text-red-600'):'text-gray-400'
            const t=new Date(r.recorded_at)
            const pList=r.photo_urls?r.photo_urls.split(',').map((u:string)=>u.trim()).filter(Boolean):[]
            return (
              <button key={r.id} type="button" onClick={()=>setSelRecord(r)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm text-left block active:scale-99 transition-transform">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${MC[r.mode]??'bg-gray-100 text-gray-600'}`}>{ML[r.mode]??r.mode}</span>
                      <span className="text-sm font-medium truncate">{r.production_line??'미지정'}</span>
                    </div>
                    <div className="text-xs font-mono text-gray-400">{r.item_code} / {r.color_code} <span className="font-sans ml-1">{t.getHours().toString().padStart(2,'0')}:{t.getMinutes().toString().padStart(2,'0')}</span></div>
                    {r.item_name&&<div className="text-xs text-gray-500 mt-0.5 truncate">{r.item_name}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {pList.length>0&&<span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">📷 {pList.length}</span>}
                    {yld!=null&&<span className={`text-xl font-bold ${yCol}`}>{parseFloat(yld).toFixed(1)}%</span>}
                  </div>
                </div>
                <div className="flex gap-3 text-xs flex-wrap">
                  {r.input_qty!=null&&<span className="text-gray-500">투입 <b className="text-gray-800">{r.input_qty}</b></span>}
                  {r.good_qty!=null&&<span className="text-gray-500">양품 <b className="text-green-700">{r.good_qty}</b></span>}
                  {r.defect_qty!=null&&r.defect_qty>0&&<span className="text-gray-500">불량 <b className="text-red-600">{r.defect_qty}</b></span>}
                  {r.defect_types&&<span className="text-gray-500">유형 <b className="text-red-600">{r.defect_types}</b></span>}
                  {r.st_seconds!=null&&<span className="text-gray-500">ST <b className="font-mono">{Math.floor(r.st_seconds/60)}′{Math.round(r.st_seconds%60).toString().padStart(2,'0')}″</b></span>}
                </div>
                {pList.length>0&&(
                  <div className="flex gap-1.5 mt-2.5">
                    {pList.slice(0,4).map((url:string,i:number)=>(
                      <div key={i} className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                      </div>
                    ))}
                    {pList.length>4&&<div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200"><span className="text-xs text-gray-500 font-medium">+{pList.length-4}</span></div>}
                  </div>
                )}
                {r.memo&&<p className="text-xs text-gray-400 mt-2 italic">"{r.memo}"</p>}
              </button>
            )
          })}
        </div>
      )}

      {selRecord&&!editRecord&&(
        <PhotoModal record={selRecord} onClose={()=>setSelRecord(null)} onEdit={()=>setEditRecord(selRecord)} />
      )}
      {editRecord&&(
        <EditModal record={editRecord} onClose={()=>setEditRecord(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}
