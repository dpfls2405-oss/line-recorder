import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'today'
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  try {
    let query = `SELECT * FROM line_records`
    const params: any[] = []

    if (filter === 'today') {
      query += ` WHERE recorded_at >= $1`
      const s = new Date(); s.setHours(0,0,0,0)
      params.push(s.toISOString())
    } else if (filter === 'week') {
      query += ` WHERE recorded_at >= $1`
      const s = new Date(); s.setDate(s.getDate()-7)
      params.push(s.toISOString())
    } else if (filter === 'custom' && dateFrom && dateTo) {
      query += ` WHERE recorded_at >= $1 AND recorded_at <= $2`
      params.push(`${dateFrom}T00:00:00`, `${dateTo}T23:59:59`)
    }

    query += ` ORDER BY recorded_at DESC LIMIT 500`
    const { rows } = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json([], { status: 500 })
  }
}
