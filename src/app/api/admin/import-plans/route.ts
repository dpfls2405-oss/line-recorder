import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// 빈 문자열/공백을 null 로 정규화 (DATE 컬럼에 '' 들어가면 오류)
const nz = (v: any) => {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}

export async function POST(req: NextRequest) {
  const rows = await req.json()
  let inserted = 0
  try {
    for (const r of rows) {
      // 중복 방지: 같은 (품목코드, 색상, 계획일, Lot) 이 이미 있으면 건너뜀.
      // 명시적 NOT EXISTS 로 처리해 unique 제약조건 유무에 의존하지 않음.
      const res = await pool.query(
        `INSERT INTO production_plans
          (item_code, color_code, item_name, production_line, line_code,
           pack_plan_date, first_pack_date, plan_qty, partner, shift, lot_number, status)
         SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active'
         WHERE NOT EXISTS (
           SELECT 1 FROM production_plans p
           WHERE p.item_code=$1
             AND COALESCE(p.color_code,'')=COALESCE($2,'')
             AND p.pack_plan_date IS NOT DISTINCT FROM $6::date
             AND COALESCE(p.lot_number,'')=COALESCE($11,'')
         )`,
        [
          nz(r.item_code), nz(r.color_code), nz(r.item_name),
          nz(r.production_line), nz(r.line_code),
          nz(r.pack_plan_date), nz(r.first_pack_date),
          r.plan_qty ?? null, nz(r.partner),
          nz(r.shift), nz(r.lot_number),
        ]
      )
      inserted += res.rowCount ?? 0
    }
    return NextResponse.json({ ok: true, inserted })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: '저장 실패: ' + (e?.message ?? e) }, { status: 500 })
  }
}
