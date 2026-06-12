import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const itemCode = searchParams.get('item_code')
  const colorCode = searchParams.get('color_code')

  if (!itemCode || !colorCode) return NextResponse.json([])

  try {
    const { data, error } = await supabase
      .from('bom')
      .select('materials(id, material_code, material_color, material_name, material_category)')
      .eq('item_code', itemCode)
      .eq('color_code', colorCode)
      .eq('is_active', true)

    if (error) throw error
    const rows = (data ?? []).map((r: any) => r.materials).filter(Boolean)
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json([])
  }
}
