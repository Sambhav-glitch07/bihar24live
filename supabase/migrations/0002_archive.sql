-- Archive = every published article, grouped by IST publication date. Nothing is auto-deleted.
create or replace function archive_years() returns table(year int, total bigint)
language sql stable as $$
  select extract(year from published_at at time zone 'Asia/Kolkata')::int, count(*)
  from articles where status='published' and published_at <= now()
  group by 1 order by 1 desc $$;

create or replace function archive_active_dates(p_year int, p_month int, p_lang text default null)
returns table(day date, total bigint) language sql stable as $$
  select (a.published_at at time zone 'Asia/Kolkata')::date, count(distinct a.id)
  from articles a join article_translations t on t.article_id=a.id
  where a.status='published'
    and a.published_at >= make_timestamptz(p_year,p_month,1,0,0,0,'Asia/Kolkata')
    and a.published_at <  make_timestamptz(p_year,p_month,1,0,0,0,'Asia/Kolkata') + interval '1 month'
    and a.published_at <= now()
    and (p_lang is null or t.language=p_lang)
  group by 1 order by 1 $$;

create or replace function archive_month_counts(p_year int)
returns table(month int, total bigint) language sql stable as $$
  select extract(month from published_at at time zone 'Asia/Kolkata')::int, count(*)
  from articles
  where status='published' and published_at <= now()
    and published_at >= make_timestamptz(p_year,1,1,0,0,0,'Asia/Kolkata')
    and published_at <  make_timestamptz(p_year+1,1,1,0,0,0,'Asia/Kolkata')
  group by 1 order by 1 $$;

create or replace function archive_search(
  p_from timestamptz default null, p_to timestamptz default null,
  p_q text default null, p_lang text default null,
  p_category uuid default null, p_district uuid default null,
  p_limit int default 20, p_offset int default 0)
returns table(article_id uuid, slug text, title text, language text, published_at timestamptz,
              cover_path text, category_id uuid, district_id uuid, total_count bigint)
language sql stable as $$
  with matching as (
    select distinct on (a.id)
      a.id as article_id, t.slug, t.title, t.language, a.published_at,
      m.storage_path as cover_path, a.category_id, a.district_id
    from articles a
    join article_translations t on t.article_id = a.id
    left join media m on m.id = a.cover_media_id
    where a.status = 'published' and a.published_at <= now()
      and (p_from is null or a.published_at >= p_from)
      and (p_to is null or a.published_at < p_to)
      and (p_lang is null or t.language = p_lang)
      and (p_category is null or a.category_id = p_category)
      and (p_district is null or a.district_id = p_district)
      and (p_q is null or p_q = '' or t.title ilike '%' || p_q || '%'
        or to_tsvector('simple', coalesce(t.title,'') || ' ' || coalesce(t.description,'') || ' ' || coalesce(t.body,''))
           @@ plainto_tsquery('simple', p_q))
    order by a.id,
      case when p_lang is not null and t.language = p_lang then 0
           when t.language = 'hi' then 1 else 2 end,
      t.language
  )
  select matching.*, count(*) over() as total_count
  from matching
  order by published_at desc, article_id
  limit greatest(1, least(coalesce(p_limit, 20), 50))
  offset greatest(coalesce(p_offset, 0), 0)
$$;
