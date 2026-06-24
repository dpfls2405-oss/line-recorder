// 기존 업로드된 사진 일괄 압축 스크립트 (일회성)
// - Supabase Storage(line-photos)의 모든 이미지를 다운로드 → 리사이즈+JPEG 압축 → 같은 경로에 덮어쓰기
// - 같은 경로로 덮어쓰므로 DB(photo_urls)의 URL은 그대로 유효
//
// 실행 전 환경변수 설정 (키는 채팅에 붙여넣지 말고 터미널에서만):
//   PowerShell:
//     $env:SUPABASE_URL="https://xxxx.supabase.co"
//     $env:SUPABASE_SERVICE_KEY="<service_role 키>"
//   실행:
//     node scripts/compress-existing.mjs
//
// 필요 패키지: @supabase/supabase-js (설치됨), sharp (npm i sharp 필요)

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY
const BUCKET = 'line-photos'
const MAX_DIM = 1600
const QUALITY = 70

if (!URL || !KEY) {
  console.error('❌ SUPABASE_URL / SUPABASE_SERVICE_KEY 환경변수를 먼저 설정하세요.')
  process.exit(1)
}

const sb = createClient(URL, KEY)

async function listAll() {
  const files = []
  let offset = 0
  const limit = 100
  for (;;) {
    const { data, error } = await sb.storage.from(BUCKET).list('', {
      limit, offset, sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw error
    if (!data || data.length === 0) break
    // 폴더가 아닌 실제 파일만 (id 존재)
    files.push(...data.filter(f => f.id))
    if (data.length < limit) break
    offset += limit
  }
  return files
}

function isImage(name) {
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(name)
}

async function run() {
  console.log('📂 파일 목록 불러오는 중...')
  const files = await listAll()
  const images = files.filter(f => isImage(f.name))
  console.log(`총 ${files.length}개 중 이미지 ${images.length}개\n`)

  let done = 0, skipped = 0, failed = 0
  let beforeTotal = 0, afterTotal = 0

  for (const f of images) {
    try {
      const { data: blob, error: dErr } = await sb.storage.from(BUCKET).download(f.name)
      if (dErr) throw dErr
      const inputBuf = Buffer.from(await blob.arrayBuffer())

      const outBuf = await sharp(inputBuf)
        .rotate() // EXIF 회전 보정
        .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: QUALITY })
        .toBuffer()

      // 압축 결과가 더 크면 건너뜀 (이미 작은 파일)
      if (outBuf.length >= inputBuf.length) {
        skipped++
        console.log(`⏭️  ${f.name}  (이미 작음, 유지: ${(inputBuf.length/1024).toFixed(0)}KB)`)
        beforeTotal += inputBuf.length; afterTotal += inputBuf.length
        continue
      }

      const { error: uErr } = await sb.storage.from(BUCKET).upload(f.name, outBuf, {
        upsert: true, contentType: 'image/jpeg', cacheControl: '3600',
      })
      if (uErr) throw uErr

      beforeTotal += inputBuf.length; afterTotal += outBuf.length
      done++
      console.log(`✅ ${f.name}  ${(inputBuf.length/1024).toFixed(0)}KB → ${(outBuf.length/1024).toFixed(0)}KB`)
    } catch (e) {
      failed++
      console.log(`❌ ${f.name}  실패: ${e.message ?? e}`)
    }
  }

  console.log('\n─────────────────────────────')
  console.log(`압축 완료: ${done} / 유지: ${skipped} / 실패: ${failed}`)
  console.log(`용량: ${(beforeTotal/1024/1024).toFixed(1)}MB → ${(afterTotal/1024/1024).toFixed(1)}MB`)
  const saved = beforeTotal - afterTotal
  if (beforeTotal > 0) console.log(`절감: ${(saved/1024/1024).toFixed(1)}MB (${(saved/beforeTotal*100).toFixed(0)}%)`)
}

run().catch(e => { console.error(e); process.exit(1) })
