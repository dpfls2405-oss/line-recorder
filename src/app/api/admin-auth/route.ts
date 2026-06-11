import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const correct = process.env.ADMIN_PASSWORD ?? process.env.APP_PASSWORD ?? 'sidiz2024'
  return NextResponse.json({ ok: password === correct }, { status: password === correct ? 200 : 401 })
}
