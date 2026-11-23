create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

create or replace function set_updated_at() returns trigger language plpgsql as
$$ begin new.updated_at = now(); return new; end $$;

-- SINGLE OWNER: refuse creation of a second auth user.
create or replace function enforce_single_user() returns trigger
language plpgsql security definer set search_path = auth, public as $$
begin
  -- Serialize concurrent signup attempts so two first-user inserts cannot race.
  perform pg_advisory_xact_lock(hashtext('bihar24live-single-owner'));
  if exists (select 1 from auth.users) then
    raise exception 'Only one owner account is permitted';
  end if;
  return new;
end $$;
create trigger single_owner_only before insert on auth.users
  for each row execute function enforce_single_user();

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role = 'owner'),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_one_owner on profiles ((true));

create or replace function is_owner() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'owner') $$;

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_hi text not null, name_en text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table districts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_hi text not null, name_en text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table media (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('image','video_thumb')),
  storage_path text not null unique,
  width int, height int, bytes int,
  caption_hi text, caption_en text, alt_hi text, alt_en text,
  created_at timestamptz not null default now()
);

create table articles (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'draft' check (status in ('draft','scheduled','published','archived')),
  category_id uuid references categories(id) on delete set null,
  district_id uuid references districts(id) on delete set null,
  cover_media_id uuid references media(id) on delete set null,
  author text,
  is_featured boolean not null default false,
  is_breaking boolean not null default false,
  published_at timestamptz,          -- archive key; preserved across edits
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null),
  check (status <> 'scheduled' or scheduled_for is not null)
);
create trigger articles_updated before update on articles for each row execute function set_updated_at();

-- Archive indexes
create index articles_published_at_idx on articles (published_at desc) where status = 'published';
create index articles_status_idx on articles (status);
create index articles_category_pub_idx on articles (category_id, published_at desc) where status = 'published';
create index articles_district_pub_idx on articles (district_id, published_at desc) where status = 'published';
create index articles_scheduled_idx on articles (scheduled_for) where status = 'scheduled';

create table article_translations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  language text not null check (language in ('hi','en')),
  slug text not null unique,
  title text not null,
  description text, body text,
  seo_title text, seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, language)
);
create trigger at_updated before update on article_translations for each row execute function set_updated_at();
create index at_language_idx on article_translations (language);
create index at_title_trgm on article_translations using gin (title gin_trgm_ops);
create index at_fts on article_translations using gin (to_tsvector('simple', coalesce(title,'')||' '||coalesce(description,'')||' '||coalesce(body,'')));

create table article_media (
  article_id uuid references articles(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,
  position int not null default 0,
  primary key (article_id, media_id)
);
create table tags (id uuid primary key default gen_random_uuid(), slug text unique not null, name_hi text, name_en text);
create table article_tags (article_id uuid references articles(id) on delete cascade, tag_id uuid references tags(id) on delete cascade, primary key (article_id, tag_id));

create table videos (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references articles(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  cloudinary_public_id text not null,
  thumbnail_media_id uuid references media(id) on delete set null,
  title_hi text, title_en text, description_hi text, description_en text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);
create table breaking_news (
  id uuid primary key default gen_random_uuid(),
  text_hi text, text_en text,
  priority int not null default 0,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table scheduled_publications (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  run_at timestamptz not null,
  executed_at timestamptz,
  error text
);
create table site_settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());
create trigger site_settings_updated before update on site_settings for each row execute function set_updated_at();

-- Keep updated_at reliable across editable newsroom records.
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();
create trigger categories_updated before update on categories for each row execute function set_updated_at();
create trigger districts_updated before update on districts for each row execute function set_updated_at();
create trigger videos_updated before update on videos for each row execute function set_updated_at();
create trigger breaking_news_updated before update on breaking_news for each row execute function set_updated_at();

-- Preserve original publication date unless the owner explicitly changes it
create or replace function preserve_published_at() returns trigger language plpgsql as $$
begin
  if old.published_at is not null and new.published_at is null then
    new.published_at := old.published_at;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;
create trigger articles_keep_pubdate before update on articles for each row execute function preserve_published_at();

-- Scheduled publishing (run every minute via pg_cron or a protected cron route)
create or replace function publish_due_articles() returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update articles set status='published', published_at = scheduled_for
   where status='scheduled' and scheduled_for <= now();
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function publish_due_articles() from public, anon, authenticated;

-- RLS: owner full access everywhere; public reads published content only
do $$ declare t text; begin
  foreach t in array array['profiles','categories','districts','media','articles','article_translations','article_media','tags','article_tags','videos','breaking_news','scheduled_publications','site_settings']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy owner_all on %I for all using (is_owner()) with check (is_owner())', t);
  end loop;
  foreach t in array array['categories','districts','tags']
  loop execute format('create policy public_read on %I for select using (true)', t); end loop;
end $$;

-- Public media metadata is limited to assets attached to currently published content.
create policy public_read on media for select using (
  exists (select 1 from articles a where a.cover_media_id = media.id
    and a.status = 'published' and a.published_at <= now())
  or exists (select 1 from article_media am join articles a on a.id = am.article_id
    where am.media_id = media.id and a.status = 'published' and a.published_at <= now())
  or exists (select 1 from videos v where v.thumbnail_media_id = media.id and v.status = 'published')
);
create policy public_read on article_media for select using (
  exists (select 1 from articles a where a.id = article_media.article_id
    and a.status = 'published' and a.published_at <= now())
);

create policy public_read on articles for select using (status='published' and published_at <= now());
create policy public_read on article_translations for select using (
  exists (select 1 from articles a where a.id = article_id and a.status='published' and a.published_at <= now()));
create policy public_read on videos for select using (status='published' and (published_at is null or published_at <= now()));
create policy public_read on article_tags for select using (
  exists (select 1 from articles a where a.id = article_tags.article_id
    and a.status = 'published' and a.published_at <= now())
);
create policy public_read on breaking_news for select using (is_active and (expires_at is null or expires_at > now()));

-- Public delivery bucket for published editorial images. Upload/delete remain owner-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy owner_upload_photos on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_owner());
create policy owner_update_photos on storage.objects for update to authenticated
  using (bucket_id = 'photos' and public.is_owner())
  with check (bucket_id = 'photos' and public.is_owner());
create policy owner_delete_photos on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_owner());
