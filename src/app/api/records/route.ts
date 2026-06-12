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
