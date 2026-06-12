import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const yieldPct = body.input_qty && body.good_qty
    ? Math.round((body.good_qty / body.input_qty) * 1000) / 10 : null
  const photoUrls: string[] = Array.isArray(body.photo_urls) ? body.photo_urls.filter(Boolean) : []

  try {
    const { data, error } = await supabase
      .from('line_records')
      .insert({
        mode: body.mode,
        plan_id: body.plan_id ?? null,
        item_code: body.item_code,
        color_code: body.color_code,
        item_name: body.item_name ?? null,
        production_line: body.production_line,
        worker: body.worker ?? null,
        shift: body.shift ?? null,
        input_qty: body.input_qty ?? null,
        good_qty: body.good_qty ?? null,
        defect_qty: body.defect_qty ?? null,
        yield_pct: yieldPct,
        defect_types: body.defect_types?.join(',') ?? null,
        defect_materials: body.defect_materials?.join(',') ?? null,
        st_seconds: body.st_seconds ?? null,
        photo_urls: photoUrls.length ? photoUrls.join(',') : null,
        video_url: body.video_url ?? null,
        memo: body.memo ?? null,
      })
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, id: data.id })
  } catch (e) {
    return NextResponse.json({ ok: false, error: '저장 실패' }, { status: 500 })
  }
}
