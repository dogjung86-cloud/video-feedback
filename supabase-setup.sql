-- ================================================
-- Supabase 테이블 생성 SQL
-- Supabase 대시보드 > SQL Editor 에서 실행하세요
-- ================================================

-- 1. projects 테이블
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default '',
  video_url text not null,
  video_type text not null default 'youtube',
  status text not null default 'in_progress',
  deadline date,
  thumbnail_url text,
  created_date timestamptz default now(),
  user_id uuid references auth.users(id) on delete cascade
);

-- 2. feedbacks 테이블
create table public.feedbacks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  content text not null,
  timestamp real,
  author_name text default '익명',
  author_email text,
  file_urls text[] default '{}',
  is_resolved boolean default false,
  created_date timestamptz default now(),
  user_id uuid references auth.users(id) on delete cascade
);

-- 3. RLS (Row Level Security) 활성화
alter table public.projects enable row level security;
alter table public.feedbacks enable row level security;

-- 4. RLS 정책 - 로그인한 사용자 누구나 읽기/쓰기 가능
create policy "Anyone can read projects"
  on public.projects for select
  to authenticated
  using (true);

create policy "Anyone can insert projects"
  on public.projects for insert
  to authenticated
  with check (true);

create policy "Anyone can update projects"
  on public.projects for update
  to authenticated
  using (true);

create policy "Anyone can delete projects"
  on public.projects for delete
  to authenticated
  using (true);

create policy "Anyone can read feedbacks"
  on public.feedbacks for select
  to authenticated
  using (true);

create policy "Anyone can insert feedbacks"
  on public.feedbacks for insert
  to authenticated
  with check (true);

create policy "Anyone can update feedbacks"
  on public.feedbacks for update
  to authenticated
  using (true);

create policy "Anyone can delete feedbacks"
  on public.feedbacks for delete
  to authenticated
  using (true);

-- 5. Storage 버킷 생성 (파일 업로드용)
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true);

-- 6. Storage 정책 - 로그인한 사용자 업로드/읽기 가능
create policy "Anyone can upload files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'uploads');

create policy "Anyone can read uploaded files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'uploads');

create policy "Public can read uploaded files"
  on storage.objects for select
  to anon
  using (bucket_id = 'uploads');
