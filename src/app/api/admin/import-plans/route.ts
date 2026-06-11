import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
  const rows = await req.json()
  try {
    for (const r of rows) {
      await pool.query(
        `INSERT INTO production_plans
          (item_code, color_code, item_name, production_line, line_code,
           pack_plan_date, first_pack_date, plan_qty, partner, shift, lot_number, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active')
         ON CONFLICT (item_code, color_code, pack_plan_date, lot_number) DO NOTHING`,
        [
          r.item_code, r.color_code, r.item_name ?? null,
          r.production_line ?? null, r.line_code ?? null,
          r.pack_plan_date ?? null, r.first_pack_date ?? null,
          r.plan_qty ?? null, r.partner ?? null,
          r.shift ?? null, r.lot_number ?? null,
        ]
      )
    }
    return NextResponse.json({ ok: true, inserted: rows.length })
  } catch (e) {
    return NextResponse.json({ ok: false, error: '저장 실패' }, { status: 500 })
  }
}
