export const DEFECT_TYPES = [
  { key:'외관', desc:'스크래치·변색' },
  { key:'치수', desc:'공차 초과' },
  { key:'기능', desc:'작동 불량' },
  { key:'공정', desc:'작업 이탈' },
  { key:'자재', desc:'입고 불량' },
  { key:'포장', desc:'파손·오염' },
  { key:'도장', desc:'도장 불량' },
  { key:'기타', desc:'기타' },
]

export const RECORD_MODES = [
  { key:'quick', label:'빠른 불량 기록', icon:'⚡', desc:'불량 발생 즉시' },
  { key:'lot',   label:'로트 마감',       icon:'📋', desc:'로트 종료 시' },
]
