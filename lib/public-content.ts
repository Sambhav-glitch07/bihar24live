import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/types/database";

export async function getPublishedTranslation(slug: string) {
  const supabase = await createClient();
  return supabase.from("article_translations")
    .select("id, article_id, language, slug, title, description, body, seo_title, seo_description, articles!inner(id, status, published_at, author, category_id, district_id, cover_media_id)")
    .eq("slug", slug).eq("articles.status", "published")
    .lte("articles.published_at", new Date().toISOString()).maybeSingle();
}

export async function getTranslationSiblings(articleId: string) {
  const supabase = await createClient();
  return supabase.from("article_translations").select("language, slug").eq("article_id", articleId);
}

export async function getPublishedListing(kind: "category" | "district", slug: string, language: Language) {
  const supabase = await createClient();
  const table = kind === "category" ? "categories" : "districts";
  const { data: term, error: termError } = await supabase.from(table).select("id, slug, name_hi, name_en").eq("slug", slug).maybeSingle();
  if (termError || !term) return { term: null, rows: [], error: termError };
  const foreignKey = kind === "category" ? "category_id" : "district_id";
  const { data, error } = await supabase.from("article_translations")
    .select("id, slug, title, description, articles!inner(status, published_at, category_id, district_id)")
    .eq("language", language).eq("articles.status", "published")
    .lte("articles.published_at", new Date().toISOString())
    .eq(`articles.${foreignKey}`, term.id)
    .order("published_at", { referencedTable: "articles", ascending: false }).limit(50);
  return { term, rows: data ?? [], error };
}
