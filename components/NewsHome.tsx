import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/types/database";

export default async function NewsHome({ language }: { language: Language }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("article_translations")
    .select("id, article_id, language, slug, title, description, articles!inner(status, published_at, is_featured, cover_media_id)")
    .eq("language", language)
    .eq("articles.status", "published")
    .lte("articles.published_at", new Date().toISOString())
    .order("published_at", { referencedTable: "articles", ascending: false })
    .limit(24);

  const { data: ticker } = await supabase.from("breaking_news")
    .select("id, text_hi, text_en, priority")
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("priority", { ascending: false }).limit(5);

  return <main className="mx-auto min-h-[55vh] max-w-7xl px-4 py-6">
    {ticker && ticker.length > 0 && <section aria-label="Breaking news" className="mb-6 flex items-start gap-3 border-y-2 border-red-700 py-3">
      <span className="shrink-0 bg-red-700 px-2 py-1 text-xs font-bold text-white">{language === "hi" ? "ब्रेकिंग" : "BREAKING"}</span>
      <div className="space-y-1">{ticker.map((item) => <p key={item.id} className="text-sm font-semibold">{language === "hi" ? item.text_hi : item.text_en}</p>)}</div>
    </section>}
    <div className="mb-5 flex items-end justify-between border-b border-neutral-200 pb-3">
      <div><p className="text-xs font-bold uppercase tracking-widest text-red-700">{language === "hi" ? "ताज़ा अपडेट" : "LATEST UPDATES"}</p><h1 className="mt-1 text-3xl font-black tracking-tight">{language === "hi" ? "ताज़ा खबरें" : "Latest News"}</h1></div>
      <Link href="/archive" className="text-sm font-semibold text-red-700">{language === "hi" ? "आर्काइव देखें" : "View archive"}</Link>
    </div>
    {error ? <p className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">News could not be loaded. Please check the database configuration.</p> : !data?.length ? <div className="border border-neutral-200 px-5 py-16 text-center"><h2 className="text-xl font-bold">{language === "hi" ? "अभी कोई खबर प्रकाशित नहीं हुई है" : "No news published yet"}</h2><p className="mt-2 text-sm text-neutral-500">{language === "hi" ? "नई खबरें प्रकाशित होने पर यहां दिखाई देंगी।" : "Published reports will appear here."}</p></div> :
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map((item) => <article key={item.id} className="border-b border-neutral-200 pb-4">
        <Link href={`/news/${item.slug}`} className="text-lg font-bold leading-snug hover:text-red-700">{item.title}</Link>
        {item.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-600">{item.description}</p>}
      </article>)}</div>}
  </main>;
}
