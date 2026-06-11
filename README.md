# 라인 생산 기록 앱

Sidiz 평택공장 라인용 시양산 생산 기록 앱. QR 코드로 접근, 스마트폰 터치 최적화.

## 화면 구성

- `/` — 메인 입력 폼 (라인용)
- `/done` — 제출 완료 확인
- `/history` — 오늘/최근 기록 조회 (관리팀용)

## 입력 모드 3가지

| 모드 | 시점 | 기록 항목 |
|------|------|----------|
| ⚡ 빠른 불량 기록 | 불량 발생 즉시 | 라인·작업자·제품·불량유형·불량수 |
| 📋 로트 마감 | 로트 종료 시 | 전체 항목 + ST |
| 🔄 교대 종료 | 교대 마감 | 전체 항목 + ST |

## 설정 변경

`src/lib/config.ts` 파일만 수정:
- `LINES` — 라인 목록
- `PRODUCTS` — 시양산 제품 목록  
- `WORKERS` — 작업자 이름 목록
- `DEFECT_TYPES` — 불량 유형 목록

## Google Sheet 헤더 (생산기록 시트)

`날짜 | 시각 | 모드 | 라인 | 작업자 | 제품 | 투입수량 | 양품수량 | 불량수량 | 수율(%) | 불량유형 | ST(초) | 특이사항`

## 배포

```bash
# 1. Supabase SQL 실행
# 2. .env.local 설정
# 3. GitHub push → Vercel 자동 배포
# 4. n8n_workflow.json import → Sheet ID 입력

npm install && npm run dev
```

## QR 코드 생성

배포 후 URL을 QR 코드로 변환해서 라인에 부착:
- qr-code-generator.com 또는 qrcode.show 사용
- A4 출력 후 라인별 기둥/작업대에 부착
