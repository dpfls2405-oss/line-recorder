import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const record = body.record

  const mode = record?.mode
  if (mode !== 'lot' && mode !== 'quick') {
    return NextResponse.json({ skipped: true })
  }

  // photo_urls가 문자열/배열 어떤 형태든 안전하게 파싱
  let photoUrls: string[] = []
  const raw = record.photo_urls
  if (Array.isArray(raw)) {
    photoUrls = raw
  } else if (typeof raw === 'string' && raw.startsWith('[')) {
    try { photoUrls = JSON.parse(raw) } catch { photoUrls = [] }
  } else if (typeof raw === 'string' && raw.length > 0) {
    photoUrls = [raw]
  }
  const firstPhoto = photoUrls[0] || null

  // 모드별 헤더
  const header = mode === 'lot'
    ? '📋 *로트 마감 기록이 등록되었습니다*'
    : '⚡ *빠른 불량 기록이 등록되었습니다*'

  // ST(초) → "X분 Y초" 포맷
  const stSeconds = record.st_seconds
  const stText = (stSeconds != null && stSeconds > 0)
    ? `${Math.floor(stSeconds / 60)}분 ${Math.round(stSeconds % 60)}초 (${stSeconds}초)`
    : null

  const blocks: object[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: header }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*품목코드*\n${record.item_code || '-'}` },
        { type: 'mrkdwn', text: `*색상*\n${record.color_code || '-'}` },
        { type: 'mrkdwn', text: `*라인*\n${record.production_line || '-'}` },
        ...(mode === 'lot' ? [
          { type: 'mrkdwn', text: `*투입/양품/불량*\n${record.input_qty ?? 0} / ${record.good_qty ?? 0} / ${record.defect_qty ?? 0}` },
          { type: 'mrkdwn', text: `*수율*\n${record.yield_pct ? record.yield_pct + '%' : '-'}` },
        ] : [
          { type: 'mrkdwn', text: `*불량수량*\n${record.defect_qty ?? 0}` },
        ]),
        // ST: 값이 있을 때만 추가
        ...(stText ? [
          { type: 'mrkdwn', text: `*ST(표준시간)*\n${stText}` },
        ] : []),
      ]
    }
  ]

  // 빠른 불량: 불량 유형 추가
  if (mode === 'quick') {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*불량 유형*\n${record.defect_types || '없음'}`
      }
    })
  }

  // 메모: 값이 있을 때만 추가
  if (record.memo && String(record.memo).trim()) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*📝 메모*\n${record.memo}` }
    })
  }

  // 동영상 링크: 값이 있을 때만 추가 (JSON 배열 또는 단일 URL 모두 처리)
  let videos: { url: string; desc: string }[] = []
  const rawVideo = record.video_url
  if (typeof rawVideo === 'string' && rawVideo.trim()) {
    if (rawVideo.trim().startsWith('[')) {
      try { videos = JSON.parse(rawVideo) } catch { videos = [] }
    } else {
      videos = [{ url: rawVideo.trim(), desc: '' }]
    }
  }
  videos = videos.filter(v => v.url && v.url.trim())
  if (videos.length > 0) {
    const links = videos
      .map((v, i) => `▶ <${v.url}|${v.desc || `영상 ${i + 1}`}>`)
      .join('\n')
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*🎬 작업 동영상*\n${links}` }
    })
  }

  // 사진 추가
  if (firstPhoto) {
    blocks.push({
      type: 'image',
      image_url: firstPhoto,
      alt_text: '불량 현장 사진'
    })

    if (photoUrls.length > 1) {
      const links = photoUrls
        .slice(1)
        .map((url: string, i: number) => `<${url}|사진 ${i + 2}>`)
        .join('  ')
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `📎 추가 사진: ${links}` }
      })
    }
  }

  const message = {
    text: mode === 'lot' ? '📋 로트 마감 기록 등록' : '⚡ 빠른 불량 기록 등록',
    blocks
  }

  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  })

  return NextResponse.json({ ok: true })
}
