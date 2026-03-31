-- projects 테이블에 overall_comment 컬럼 추가
-- Supabase 대시보드 > SQL Editor 에서 실행하세요
alter table public.projects add column overall_comment text default '';
