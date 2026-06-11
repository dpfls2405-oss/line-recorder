import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const itemCode = searchParams.get('item_code')
  const colorCode = searchParams.get('color_code')

  if (!itemCode || !colorCode) return NextResponse.json([])

  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.material_code, m.material_color, m.material_name, m.material_category
       FROM bom b JOIN materials m ON b.material_id = m.id
       WHERE b.item_code=$1 AND b.color_code=$2 AND b.is_active=true`,
      [itemCode, colorCode]
    )
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json([])
  }
}
