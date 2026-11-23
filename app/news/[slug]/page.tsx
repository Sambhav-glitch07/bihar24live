import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedTranslation, getTranslationSiblings } from "@/lib/public-content";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await getPublishedTranslation(slug);
  if (!data) return { title: "News not found" };
  return { title: data.seo_title || data.title, description: data.seo_description || data.description || undefined,
    alternates: { canonical: `${SITE_URL}/news/${data.slug}` }, openGraph: { type: "article", title: data.seo_title || data.title, description: data.seo_description || data.description || undefined } };
}
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const { data: article, error } = await getPublishedTranslation(slug);
  if (error || !article) notFound();
  const relation = article.articles as unknown as { published_at: string; author: string | null; cover_media_id: string | null };
  const siblings = await getTranslationSiblings(article.article_id);
  const alternate = siblings.data?.find(x => x.language !== article.language);
  let imageUrl: string | null = null;
  if (relation.cover_media_id) {
    const supabase = await createClient();
    const { data: media } = await supabase.from("media").select("storage_path, alt_hi, alt_en, caption_hi, caption_en").eq("id", relation.cover_media_id).maybeSingle();
    if (media) imageUrl = supabase.storage.from("photos").getPublicUrl(media.storage_path).data.publicUrl;
  }
  const date = new Date(relation.published_at).toLocaleDateString(article.language === "hi" ? "hi-IN" : "en-IN", { timeZone: "Asia/Kolkata", dateStyle: "long" });
  return <main className="mx-auto max-w-4xl px-4 py-8"><div className="mb-5 flex items-center justify-between gap-3 text-sm"><Link href="/archive" className="font-semibold text-red-700">{article.language === "hi" ? "समाचार संग्रह" : "News archive"}</Link>{alternate && <Link href={`/news/${alternate.slug}`} className="border px-3 py-2">{alternate.language === "hi" ? "हिन्दी में पढ़ें" : "Read in English"}</Link>}</div><article><h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">{article.title}</h1>{article.description && <p className="mt-4 text-lg leading-8 text-neutral-600">{article.description}</p>}<div className="mt-5 flex flex-wrap gap-3 border-y border-neutral-200 py-3 text-xs text-neutral-500"><time dateTime={relation.published_at}>{date}</time>{relation.author && <span>{article.language === "hi" ? "रिपोर्ट: " : "By "}{relation.author}</span>}</div>{imageUrl && <img src={imageUrl} alt={article.title} className="mt-6 max-h-[520px] w-full object-cover" />}{article.body ? <div className="mt-8 whitespace-pre-wrap text-base leading-8 text-neutral-800">{article.body}</div> : <p className="mt-8 text-neutral-500">{article.language === "hi" ? "इस खबर का पूरा विवरण उपलब्ध नहीं है।" : "The full report is not available."}</p>}</article></main>;
}
