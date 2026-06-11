import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
export async function POST(req: NextRequest) {
  const rows = await req.json()
  const { error } = await supabase.from('production_plans')
    .upsert(rows.map((r: any) => ({
      item_code: r.item_code, color_code: r.color_code, item_name: r.item_name ?? null,
      production_line: r.production_line ?? null, line_code: r.line_code ?? null,
      pack_plan_date: r.pack_plan_date ?? null, first_pack_date: r.first_pack_date ?? null,
      plan_qty: r.plan_qty ?? null, partner: r.partner ?? null,
      shift: r.shift ?? null, lot_number: r.lot_number ?? null, status: 'active',
    })), { onConflict: 'item_code,color_code,pack_plan_date,lot_number', ignoreDuplicates: true })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, inserted: rows.length })
}
