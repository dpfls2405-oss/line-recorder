import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
export async function POST(req: NextRequest) {
  const rows = await req.json()
  const uniqueMats = Array.from(new Map(rows.map((r: any) => [`${r.material_code}::${r.material_color}`, {
    material_code: r.material_code, material_color: r.material_color,
    material_name: r.material_name, material_category: r.material_category ?? null,
  }])).values())
  const { error: matErr } = await supabase.from('materials')
    .upsert(uniqueMats, { onConflict: 'material_code,material_color', ignoreDuplicates: false })
  if (matErr) return NextResponse.json({ ok: false, error: matErr.message }, { status: 500 })
  const { data: matData } = await supabase.from('materials').select('id,material_code,material_color')
  const matMap = new Map((matData ?? []).map((m: any) => [`${m.material_code}::${m.material_color}`, m.id]))
  const bomPayload = rows.map((r: any) => ({
    item_code: r.item_code, color_code: r.color_code,
    material_id: matMap.get(`${r.material_code}::${r.material_color}`), quantity: r.quantity ?? 1,
  })).filter((r: any) => r.material_id)
  const { error: bomErr } = await supabase.from('bom')
    .upsert(bomPayload, { onConflict: 'item_code,color_code,material_id', ignoreDuplicates: true })
  if (bomErr) return NextResponse.json({ ok: false, error: bomErr.message }, { status: 500 })
  return NextResponse.json({ ok: true, materials: uniqueMats.length, bom_rows: bomPayload.length })
}
