-- ============================================================
-- line-recorder 스키마 v2 추가 테이블
-- (기존 line_records 테이블은 그대로 유지)
-- ============================================================

-- 1. 제품 마스터
create table if not exists product_master (
  id           uuid default gen_random_uuid() primary key,
  product_code text not null,       -- T90, T80, TC13 ...
  color        text not null,       -- 블랙, 그레이, 화이트 ...
  full_name    text not null unique, -- T90 블랙 (line_records.product 값과 일치)
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- 2. 자재 마스터
create table if not exists materials (
  id            uuid default gen_random_uuid() primary key,
  material_code text unique not null, -- ERP 자재코드 (예: MAT-001)
  material_name text not null,        -- 자재명 (예: 등받이 패브릭)
  category      text,                 -- 부품 분류 (등받이, 좌석, 팔걸이, 가스레버 등)
  unit          text default 'EA',
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 3. BOM (제품 ↔ 자재 연결)
create table if not exists bom (
  id          uuid default gen_random_uuid() primary key,
  product_id  uuid references product_master(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  quantity    numeric default 1,
  unit        text default 'EA',
  note        text,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  unique (product_id, material_id)
);

-- 4. line_records에 자재코드 컬럼 추가
alter table line_records
  add column if not exists material_codes text; -- 선택된 자재코드 쉼표 구분 문자열

-- ── 샘플 데이터 ────────────────────────────────────────────

-- 제품 마스터
insert into product_master (product_code, color, full_name) values
  ('T90', '블랙',   'T90 블랙'),
  ('T90', '그레이', 'T90 그레이'),
  ('T80', '그레이', 'T80 메쉬 그레이'),
  ('T50', '화이트', 'T50 화이트'),
  ('TC13','블루',   'TC13 블루'),
  ('TC13','블랙',   'TC13 블랙')
on conflict (full_name) do nothing;

-- 자재 마스터 (예시)
insert into materials (material_code, material_name, category) values
  ('FAB-001', '등받이 패브릭 (블랙)',    '등받이'),
  ('FAB-002', '좌석 패브릭 (블랙)',      '좌석'),
  ('FAB-003', '등받이 패브릭 (그레이)',  '등받이'),
  ('FAB-004', '좌석 패브릭 (그레이)',    '좌석'),
  ('MES-001', '등받이 메쉬 (그레이)',    '등받이'),
  ('PLT-001', '좌석 플레이트 (공용)',    '골조'),
  ('ARM-001', '팔걸이 어셈블리 (공용)',  '팔걸이'),
  ('GAS-001', '가스레버 (공용)',         '기능부품'),
  ('WHL-001', '바퀴 (공용)',             '기능부품'),
  ('PKG-001', '포장박스 (T90)',          '포장'),
  ('PKG-002', '포장박스 (T80)',          '포장'),
  ('PKG-003', '포장박스 (TC13)',         '포장')
on conflict (material_code) do nothing;

-- BOM 연결 (T90 블랙)
insert into bom (product_id, material_id, quantity) 
select p.id, m.id, 1
from product_master p, materials m
where p.full_name = 'T90 블랙'
  and m.material_code in ('FAB-001','FAB-002','PLT-001','ARM-001','GAS-001','WHL-001','PKG-001')
on conflict do nothing;

-- BOM 연결 (T80 메쉬 그레이)
insert into bom (product_id, material_id, quantity)
select p.id, m.id, 1
from product_master p, materials m
where p.full_name = 'T80 메쉬 그레이'
  and m.material_code in ('MES-001','FAB-004','PLT-001','ARM-001','GAS-001','WHL-001','PKG-002')
on conflict do nothing;

-- RLS 비활성화
alter table product_master disable row level security;
alter table materials      disable row level security;
alter table bom            disable row level security;
