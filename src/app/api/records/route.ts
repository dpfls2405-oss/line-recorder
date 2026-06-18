import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'today'
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  try {
    let query = supabase
      .from('line_records')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(500)

    if (filter === 'today') {
      const s = new Date(); s.setHours(0, 0, 0, 0)
      query = query.gte('recorded_at', s.toISOString())
    } else if (filter === 'week') {
      const s = new Date(); s.setDate(s.getDate() - 7)
      query = query.gte('recorded_at', s.toISOString())
    } else if (filter === 'custom' && dateFrom && dateTo) {
      query = query
        .gte('recorded_at', `${dateFrom}T00:00:00`)
        .lte('recorded_at', `${dateTo}T23:59:59`)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json([], { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, notify, ...fields } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: 'id 필요' }, { status: 400 })

    const allowed = ['production_line','item_code','color_code','item_name','input_qty','good_qty','defect_qty','defect_types','defect_materials','memo','video_url','st_seconds']
    const numeric = new Set(['input_qty','good_qty','defect_qty','st_seconds'])
    const update: Record<string, any> = {}
    for (const k of allowed) {
      if (!(k in fields)) continue
      let v = fields[k]
      // 숫자 컬럼: 빈 문자열/undefined → null, 그 외 숫자로 변환 (integer 에러 방지)
      if (numeric.has(k)) {
        v = (v === '' || v === null || v === undefined) ? null : Number(v)
        if (v !== null && Number.isNaN(v)) v = null
      }
      update[k] = v
    }

    if ('input_qty' in update && 'good_qty' in update && update.input_qty !== null && update.good_qty !== null) {
      const inp = Number(update.input_qty) || 0
      const good = Number(update.good_qty) || 0
      update.defect_qty = inp - good
      update.yield_pct = inp > 0 ? ((good / inp) * 100).toFixed(2) : null
    }

    const { error } = await supabase.from('line_records').update(update).eq('id', id)
    if (error) throw error

    // 수정 후 슬랙 재알림 (notify=true 일 때만)
    if (notify) {
      try {
        const { data: full } = await supabase.from('line_records').select('*').eq('id', id).single()
        if (full) {
          const origin = new URL(req.url).origin
          await fetch(`${origin}/api/slack-notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ record: full, edited: true }),
          })
        }
      } catch { /* 알림 실패는 수정 성공에 영향 주지 않음 */ }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? '수정 실패' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, error: 'id 필요' }, { status: 400 })

    const { error } = await supabase.from('line_records').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? '삭제 실패' }, { status: 500 })
  }
}
