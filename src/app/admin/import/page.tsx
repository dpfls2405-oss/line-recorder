'use client'
import { useState, useRef } from 'react'

function StatusBadge({ s }: { s:string }) {
  const map: Record<string,string> = { idle:'', parsing:'분석 중...', preview:'미리보기', uploading:'업로드 중...', done:'완료', error:'오류' }
  const color: Record<string,string> = { done:'text-green-700 bg-green-50', error:'text-red-700 bg-red-50', parsing:'text-blue-700 bg-blue-50', uploading:'text-blue-700 bg-blue-50', preview:'text-gray-700 bg-gray-100' }
  if(s==='idle') return null
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${color[s]}`}>{map[s]}</span>
}

export default function ImportPage() {
  const [planStatus,setPlanStatus]=useState('idle'); const [planRows,setPlanRows]=useState<any[]>([]); const [planMsg,setPlanMsg]=useState(''); const [planKind,setPlanKind]=useState<'assembly'|'process'|''>('')
  const [bomStatus,setBomStatus]=useState('idle'); const [bomRows,setBomRows]=useState<any[]>([]); const [bomMsg,setBomMsg]=useState('')
  const [bomProgress,setBomProgress]=useState(0)
  const planRef=useRef<HTMLInputElement>(null); const bomRef=useRef<HTMLInputElement>(null)

  async function parsePlans(file:File) {
    setPlanStatus('parsing'); setPlanMsg(''); setPlanKind('')
    try {
      const XLSX=await import('xlsx'); const buf=await file.arrayBuffer(); const wb=XLSX.read(buf,{type:'array',cellDates:true}); const ws=wb.Sheets[wb.SheetNames[0]]
      const raw:any[]=XLSX.utils.sheet_to_json(ws,{defval:null})
      const toDate=(v:any)=>v?(v instanceof Date?v.toISOString().slice(0,10):String(v).slice(0,10)):''
      // 가공 파일은 '부품코드' 컬럼, 조립 파일은 '품목코드' 컬럼으로 자동 구분
      const isProcess = raw.length>0 && raw.some(r=>r['부품코드'])
      let rows:any[]
      if (isProcess) {
        rows=raw.filter(r=>r['부품코드']&&r['부품코드']!=='Total').map(r=>({
          item_code:String(r['부품코드']??'').trim(), color_code:String(r['부품색상']??'').trim(), item_name:String(r['부품명']??'').trim(),
          // 가공: 생산라인=작업설비(공정), line_code=현공정
          production_line:String(r['작업설비']??'').trim(), line_code:String(r['현공정']??'').trim(),
          pack_plan_date:toDate(r['투입일자']), first_pack_date:toDate(r['최초투입일자']),
          plan_qty:parseInt(r['계획량'])||0, partner:String(r['청구자']??'').trim(),
          shift:String(r['SHIFT_가공']??r['SHIFT_포장']??'').trim(), lot_number:String(r['Lotno']??'').trim(),
        })).filter(r=>r.item_code)
        setPlanKind('process')
      } else {
        rows=raw.filter(r=>r['품목코드']&&r['품목코드']!=='Total').map(r=>({
          item_code:String(r['품목코드']??'').trim(), color_code:String(r['색상']??'').trim(), item_name:String(r['단품명칭']??'').trim(),
          production_line:String(r['생산라인']??'').trim(), line_code:String(r['생산라인코드']??'').trim(),
          pack_plan_date:toDate(r['포장계획일']), first_pack_date:toDate(r['최초포장계획일']),
          plan_qty:parseInt(r['계획량'])||0, partner:String(r['협력사']??'').trim(), shift:String(r['Shift']??'').trim(), lot_number:String(r['Lot번호']??'').trim(),
        })).filter(r=>r.item_code)
        setPlanKind('assembly')
      }
      setPlanRows(rows); setPlanStatus('preview')
    } catch(e:any){ setPlanStatus('error'); setPlanMsg('파싱 오류: '+e.message) }
  }

  async function uploadPlans() {
    setPlanStatus('uploading')
    const res=await fetch('/api/admin/import-plans',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(planRows)})
    const data=await res.json()
    if(data.ok){ setPlanStatus('done'); setPlanMsg(`${data.inserted}건 등록 완료`) }
    else{ setPlanStatus('error'); setPlanMsg(data.error) }
  }

  async function parseBom(file:File) {
    setBomStatus('parsing'); setBomMsg('')
    try {
      const buf=await file.arrayBuffer(); const text=new TextDecoder('utf-16le').decode(buf)
      const Papa=(await import('papaparse')).default; const result=Papa.parse(text,{header:true,delimiter:'\t',skipEmptyLines:true})
      const rows=(result.data as any[]).filter(r=>r['자재코드']&&r['단품코드']).map(r=>({
        item_code:String(r['단품코드']??'').trim(), color_code:String(r['단품컬러']??'').trim(),
        material_code:String(r['자재코드']??'').trim(), material_color:String(r['자재색상']??'XX').trim()||'XX',
        material_name:String(r['자재명칭']??'').trim(), material_category:String(r['자재구분']??'').trim(), quantity:parseFloat(r['소요량'])||1,
      })).filter(r=>r.material_code)
      setBomRows(rows); setBomStatus('preview')
    } catch(e:any){ setBomStatus('error'); setBomMsg('파싱 오류: '+e.message) }
  }

  async function uploadBom() {
    setBomStatus('uploading')
    setBomProgress(0)
    const BATCH = 1000
    const total = bomRows.length
    let totalMaterials = 0
    let totalBom = 0

    try {
      for (let i = 0; i < total; i += BATCH) {
        const chunk = bomRows.slice(i, i + BATCH)
        const res = await fetch('/api/admin/import-bom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk)
        })
        const data = await res.json()
        if (!data.ok) {
          setBomStatus('error')
          setBomMsg(data.error)
          return
        }
        totalMaterials += data.materials ?? 0
        totalBom += data.bom_rows ?? 0
        setBomProgress(Math.round((Math.min(i + BATCH, total) / total) * 100))
      }
      setBomStatus('done')
      setBomMsg(`자재 ${totalMaterials}종 / BOM ${totalBom}건 등록 완료`)
    } catch(e:any) {
      setBomStatus('error')
      setBomMsg('업로드 오류: ' + e.message)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-medium text-gray-900">데이터 가져오기</h1>

      {/* XLS */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-700 text-sm font-bold">XL</div>
          <div className="flex-1"><h2 className="text-sm font-medium text-gray-900">생산 계획 등록 <span className="text-xs font-normal text-gray-400">(조립·가공 자동 감지)</span></h2><p className="text-xs text-gray-400 mt-0.5">조립/가공 계획 .xls 파일 업로드 — 부품코드 유무로 자동 구분</p></div>
          {planKind&&(planStatus==='preview'||planStatus==='uploading')&&<span className={`text-xs px-2 py-0.5 rounded font-medium ${planKind==='process'?'bg-orange-50 text-orange-700':'bg-green-50 text-green-700'}`}>{planKind==='process'?'가공':'조립'}</span>}
          <StatusBadge s={planStatus} />
        </div>
        <div className="p-5 space-y-4">
          <input ref={planRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={e=>e.target.files?.[0]&&parsePlans(e.target.files[0])} />
          {(planStatus==='idle'||planStatus==='error')&&(
            <div>
              <button onClick={()=>planRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors w-full justify-center">XLS 파일 선택</button>
              {planMsg&&<p className="text-xs text-red-600 mt-2">{planMsg}</p>}
            </div>
          )}
          {planStatus==='parsing'&&<p className="text-sm text-blue-600">파일 분석 중...</p>}
          {planStatus==='done'&&<div className="flex items-center gap-3"><span className="text-sm text-green-700 font-medium">✓ {planMsg}</span><button onClick={()=>{setPlanStatus('idle');setPlanRows([]);setPlanMsg('');setPlanKind('')}} className="text-xs text-gray-400 hover:text-gray-600">다시 업로드</button></div>}
          {(planStatus==='preview'||planStatus==='uploading')&&(
            <div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg mb-3">
                <table className="text-xs w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{(planKind==='process'?['부품코드','색상','부품명','생산라인(설비)','투입일자','계획량','Shift','Lot']:['품목코드','색상','단품명칭','생산라인','포장계획일','계획량','Shift','Lot번호']).map(h=><th key={h} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {planRows.slice(0,8).map((r,i)=>(
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono font-medium">{r.item_code}</td><td className="px-3 py-2 font-mono">{r.color_code}</td>
                        <td className="px-3 py-2 max-w-32 truncate">{r.item_name}</td><td className="px-3 py-2 whitespace-nowrap">{r.production_line}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.pack_plan_date}</td><td className="px-3 py-2 text-right">{r.plan_qty}</td>
                        <td className="px-3 py-2">{r.shift}</td><td className="px-3 py-2 font-mono">{r.lot_number}</td>
                      </tr>
                    ))}
                    {planRows.length>8&&<tr><td colSpan={8} className="px-3 py-2 text-gray-400 text-center">... 외 {planRows.length-8}건</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">총 <strong>{planRows.length}건</strong> 등록 예정</p>
                <div className="flex gap-2">
                  <button onClick={()=>{setPlanStatus('idle');setPlanRows([])}} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">취소</button>
                  <button onClick={uploadPlans} disabled={planStatus==='uploading'} className="px-4 py-1.5 bg-green-800 text-white rounded-lg text-xs font-medium disabled:bg-gray-400">{planStatus==='uploading'?'등록 중...':'등록 확정'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSV BOM */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 text-sm font-bold">BOM</div>
          <div className="flex-1"><h2 className="text-sm font-medium text-gray-900">BOM 데이터 등록</h2><p className="text-xs text-gray-400 mt-0.5">품목_데이터_확인용.csv 업로드</p></div>
          <StatusBadge s={bomStatus} />
        </div>
        <div className="p-5 space-y-4">
          <input ref={bomRef} type="file" accept=".csv" className="hidden" onChange={e=>e.target.files?.[0]&&parseBom(e.target.files[0])} />
          {(bomStatus==='idle'||bomStatus==='error')&&(
            <div>
              <button onClick={()=>bomRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-700 transition-colors w-full justify-center">CSV 파일 선택 (UTF-16 탭구분)</button>
              {bomMsg&&<p className="text-xs text-red-600 mt-2">{bomMsg}</p>}
            </div>
          )}
          {bomStatus==='parsing'&&<p className="text-sm text-blue-600">파일 분석 중...</p>}
          {bomStatus==='done'&&<div className="flex items-center gap-3"><span className="text-sm text-green-700 font-medium">✓ {bomMsg}</span><button onClick={()=>{setBomStatus('idle');setBomRows([]);setBomMsg('')}} className="text-xs text-gray-400 hover:text-gray-600">다시 업로드</button></div>}
          {(bomStatus==='preview'||bomStatus==='uploading')&&(
            <div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg mb-3">
                <table className="text-xs w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['단품코드','단품컬러','자재코드','자재색상','자재명칭','자재구분','소요량'].map(h=><th key={h} className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bomRows.slice(0,8).map((r,i)=>(
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono font-medium">{r.item_code}</td><td className="px-3 py-2 font-mono">{r.color_code}</td>
                        <td className="px-3 py-2 font-mono">{r.material_code}</td>
                        <td className="px-3 py-2"><span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.material_color==='XX'?'bg-gray-100 text-gray-500':'bg-blue-50 text-blue-700'}`}>{r.material_color}</span></td>
                        <td className="px-3 py-2 max-w-40 truncate">{r.material_name}</td>
                        <td className="px-3 py-2"><span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{r.material_category}</span></td>
                        <td className="px-3 py-2 text-right">{r.quantity}</td>
                      </tr>
                    ))}
                    {bomRows.length>8&&<tr><td colSpan={7} className="px-3 py-2 text-gray-400 text-center">... 외 {bomRows.length-8}건</td></tr>}
                  </tbody>
                </table>
              </div>
              {bomStatus==='uploading'&&(
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>업로드 중...</span>
                    <span>{bomProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{width:`${bomProgress}%`}}></div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600"><strong>{new Set(bomRows.map(r=>`${r.material_code}::${r.material_color}`)).size}</strong>종 자재 / <strong>{bomRows.length}</strong>건 BOM</div>
                <div className="flex gap-2">
                  <button onClick={()=>{setBomStatus('idle');setBomRows([])}} disabled={bomStatus==='uploading'} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">취소</button>
                  <button onClick={uploadBom} disabled={bomStatus==='uploading'} className="px-4 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-medium disabled:bg-gray-400">{bomStatus==='uploading'?`등록 중... ${bomProgress}%`:'등록 확정'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
