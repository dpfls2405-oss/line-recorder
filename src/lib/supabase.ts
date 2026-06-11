import { createClient } from '@supabase/supabase-js'
// Storage 전용 클라이언트 (사진 업로드에만 사용)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(url, key)
