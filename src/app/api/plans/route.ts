import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const line = searchParams.get('line')
  const date = searchParams.get('date')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  try {
    let query = supabase
      .from('production_plans')
      .select('*')
      .eq('status', 'active')
      .order('pack_plan_date')

    if (dateFrom && dateTo) {
      query = query.gte('pack_plan_date', dateFrom).lte('pack_plan_date', dateTo)
    } else if (date) {
      query = query.eq('pack_plan_date', date)
    }
    if (line) {
      query = query.ilike('production_line', `%${line}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json([], { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  try {
    const { error } = await supabase
      .from('production_plans')
      .update({ status })
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
