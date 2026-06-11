-- ============================================================
-- line-recorder 스키마 v3 (실제 XLS/CSV 데이터 구조 기반)
-- 기존 테이블 드롭 후 재생성
-- ============================================================

drop table if exists bom           cascade;
drop table if exists materials     cascade;
drop table if exists product_master cascade;
drop table if exists production_plans cascade;

-- ── 1. 시양산 투입 계획 (XLS 업로드로 생성) ─────────────────
create table production_plans (
  id                uuid default gen_random_uuid() primary key,
  item_code         text not null,        -- 품목코드 (CH6800RAHT)
  color_code        text not null,        -- 색상코드 (836DBK)
  item_name         text,                 -- 단품명칭
  production_line   text,                 -- 생산라인 (라인]T50-1)
  line_code         text,                 -- 생산라인코드 (05205B)
  pack_plan_date    date,                 -- 포장계획일
  first_pack_date   date,                 -- 최초포장계획일
  plan_qty          integer,              -- 계획량
  partner           text,                 -- 협력사
  shift             text,                 -- Shift (오전/오후)
  lot_number        text,                 -- Lot번호
  status            text default 'active' -- active | complete | hold
    check (status in ('active','complete','hold')),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  unique (item_code, color_code, pack_plan_date, lot_number)
);

-- ── 2. 자재 마스터 (CSV BOM 업로드로 생성) ────────────────────
create table materials (
  id              uuid default gen_random_uuid() primary key,
  material_code   text not null,   -- 자재코드 (C23-3I-001A)
  material_color  text not null,   -- 자재색상 (BK / XX)
  material_name   text not null,   -- 자재명칭
  material_category text,          -- 자재구분 (부재료/포장재료/소모품 등)
  is_active       boolean default true,
  created_at      timestamptz default now(),
  unique (material_code, material_color)
);

-- ── 3. BOM (단품코드+색상 → 자재코드+자재색상) ───────────────
create table bom (
  id              uuid default gen_random_uuid() primary key,
  item_code       text not null,   -- 단품코드 (T51HLDA0KK)
  color_code      text not null,   -- 단품컬러 (5F6ABK)
  material_id     uuid references materials(id) on delete cascade,
  quantity        numeric default 1,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  unique (item_code, color_code, material_id)
);

-- ── 4. 생산 기록 (line_records 재생성) ───────────────────────
drop table if exists line_records cascade;

create table line_records (
  id              uuid default gen_random_uuid() primary key,
  recorded_at     timestamptz default now(),
  mode            text not null check (mode in ('quick','lot','shift')),
  -- 제품 정보 (production_plans에서 참조)
  plan_id         uuid references production_plans(id),
  item_code       text not null,   -- 품목코드
  color_code      text not null,   -- 색상코드
  item_name       text,
  production_line text not null,
  -- 작업자/환경
  worker          text not null,
  shift           text,
  -- 생산량
  input_qty       integer,
  good_qty        integer,
  defect_qty      integer,
  yield_pct       numeric(5,2),
  -- 불량 정보
  defect_types    text,            -- 쉼표 구분 (외관,치수)
  defect_materials text,           -- 자재코드+색상 쉼표 구분 (C23-3I-001A:BK,FAB-001:XX)
  -- ST
  st_seconds      numeric(6,1),
  memo            text,
  synced          boolean default false,
  created_at      timestamptz default now()
);

-- ── 인덱스 ────────────────────────────────────────────────────
create index on production_plans(pack_plan_date);
create index on production_plans(item_code, color_code);
create index on bom(item_code, color_code);
create index on line_records(recorded_at desc);
create index on line_records(item_code, color_code);

-- ── RLS 비활성화 ──────────────────────────────────────────────
alter table production_plans disable row level security;
alter table materials        disable row level security;
alter table bom              disable row level security;
alter table line_records     disable row level security;

-- photo_urls 컬럼 추가 (v3 실행 후 추가 마이그레이션)
-- 이미 v3 실행했다면 아래 ALTER만 별도 실행
-- alter table line_records add column if not exists photo_urls text;
