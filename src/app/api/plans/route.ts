import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const line = searchParams.get('line')
  const date = searchParams.get('date')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  try {
    let query = `SELECT * FROM production_plans WHERE status='active'`
    const params: any[] = []

    if (dateFrom && dateTo) {
      params.push(dateFrom); query += ` AND pack_plan_date>=$${params.length}`
      params.push(dateTo); query += ` AND pack_plan_date<=$${params.length}`
    } else if (date) {
      params.push(date)
      query += ` AND pack_plan_date=$${params.length}`
    }
    if (line) {
      params.push(`%${line}%`)
      query += ` AND production_line ILIKE $${params.length}`
    }
    query += ` ORDER BY pack_plan_date`

    const { rows } = await pool.query(query, params)
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json([], { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json()
  try {
    await pool.query(`UPDATE production_plans SET status=$1 WHERE id=$2`, [status, id])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
