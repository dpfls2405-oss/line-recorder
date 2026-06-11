-- 생산 기록 테이블
create table if not exists line_records (
  id           uuid default gen_random_uuid() primary key,
  recorded_at  timestamptz default now(),
  mode         text not null check (mode in ('quick','lot','shift')),
  line         text not null,
  worker       text not null,
  product      text not null,
  -- 생산량 (quick 모드는 null 가능)
  input_qty    integer,
  good_qty     integer,
  defect_qty   integer,
  yield_pct    numeric(5,2),
  -- 불량 유형 (쉼표 구분 문자열)
  defect_types text,
  -- ST (로트 마감·교대 종료만)
  st_seconds   numeric(6,1),
  -- 메모
  memo         text,
  -- Google Sheets 동기화 여부
  synced       boolean default false,
  created_at   timestamptz default now()
);

-- 인덱스
create index if not exists idx_line_records_recorded_at on line_records(recorded_at desc);
create index if not exists idx_line_records_line on line_records(line);
create index if not exists idx_line_records_product on line_records(product);

alter table line_records disable row level security;
