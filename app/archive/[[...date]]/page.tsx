import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArchiveCalendar from "@/components/ArchiveCalendar";
import { getActiveDates, getMonthCounts, getYears, searchArchive } from "@/lib/archive";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

type P = { params: Promise<{ date?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
export const revalidate = 300;

function parse(date: string[] = []) {
  const [y, m, d] = date.map(Number);
  if (date.length > 3 || date.some((x) => !/^\d+$/.test(x))) return null;
  if (y && (y < 2000 || y > 2100)) return null;
  if (m && (m < 1 || m > 12)) return null;
  if (d && (d < 1 || d > new Date(Date.UTC(y, m, 0)).getUTCDate())) return null;
  if (date.length >= 2 && (!y || !m)) return null;
  if (date.length >= 3 && !d) return null;
  return { year: y, month: m, day: d };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const date = (await params).date ?? [];
  return {
    title: `News Archive${date.length ? " " + date.join("-") : ""} | BIHAR 24 LIVE`,
    description: "Searchable archive of every BIHAR 24 LIVE news report by date, category and district.",
    alternates: { canonical: `${SITE_URL}/archive${date.length ? "/" + date.join("/") : ""}` },
  };
}

export default async function ArchivePage({ params, searchParams }: P) {
  const parsed = parse((await params).date);
  if (!parsed) notFound();
  const p = parsed as NonNullable<typeof parsed>;
  const sp = await searchParams;
  const rawLang = first(sp.lang);
  const lang: "hi" | "en" | undefined = rawLang === "hi" ? "hi" : rawLang === "en" ? "en" : undefined;
  const q = first(sp.q), category = first(sp.category), district = first(sp.district);
  const filters = { ...p, q, lang, category, district, page: Number(first(sp.page)) || 1 };
  const isEn = lang === "en";
  const istNow = new Date(Date.now() + 330 * 60 * 1000);
  const calYear = p.year ?? istNow.getUTCFullYear(), calMonth = p.month ?? istNow.getUTCMonth() + 1;

  const sb = await createClient();
  const [years, months, active, result, cats, dists] = await Promise.all([
    getYears(), p.year ? getMonthCounts(p.year) : Promise.resolve([]),
    getActiveDates(calYear, calMonth, lang), searchArchive(filters),
    sb.from("categories").select("id,name_hi,name_en").order("sort_order"),
    sb.from("districts").select("id,name_hi,name_en").order("name_en"),
  ]);
  const qs = new URLSearchParams(Object.entries({ q, lang, category, district })
    .filter(([, v]) => v) as [string, string][]).toString();
  const keep = qs ? `?${qs}` : "";
  const pageHref = (n: number) => { const u = new URLSearchParams(qs); u.set("page", String(n)); return `?${u}`; };
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-3xl font-bold">{isEn ? "News Archive" : "समाचार संग्रह"}</h1>
      <nav aria-label="Years" className="mt-4 flex flex-wrap gap-2 text-sm">
        {years.map((y) => <Link key={y.year} href={`/archive/${y.year}${keep}`}
          className={`border px-3 py-1 ${p.year === y.year ? "bg-red-700 text-white" : ""}`}>{y.year} ({y.total})</Link>)}
      </nav>
      {p.year && <nav aria-label="Months" className="mt-2 flex flex-wrap gap-2 text-sm">
        {months.map((m) => <Link key={m.month} href={`/archive/${p.year}/${pad(m.month)}${keep}`}
          className={`border px-3 py-1 ${p.month === m.month ? "bg-black text-white" : ""}`}>{pad(m.month)} ({m.total})</Link>)}
      </nav>}

      <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <ArchiveCalendar year={calYear} month={calMonth} active={active} qs={keep} />
          <form className="space-y-2 text-sm" method="get">
            <input name="q" defaultValue={q} placeholder="Headline or keyword" className="w-full border p-2" />
            <select name="lang" defaultValue={lang ?? ""} className="w-full border p-2">
              <option value="">{isEn ? "Hindi + English" : "हिन्दी + अंग्रेज़ी"}</option><option value="hi">हिन्दी</option><option value="en">English</option></select>
            <select name="category" defaultValue={category ?? ""} className="w-full border p-2">
              <option value="">All categories</option>{cats.data?.map((c) => <option key={c.id} value={c.id}>{lang === "en" ? c.name_en : c.name_hi}</option>)}</select>
            <select name="district" defaultValue={district ?? ""} className="w-full border p-2">
              <option value="">All districts</option>{dists.data?.map((d) => <option key={d.id} value={d.id}>{lang === "en" ? d.name_en : d.name_hi}</option>)}</select>
            <button className="w-full bg-red-700 p-2 font-semibold text-white">{isEn ? "Search archive" : "आर्काइव खोजें"}</button>
          </form>
        </aside>

        <section>
          <p className="mb-3 text-sm text-neutral-600">{result.total} {isEn ? "articles" : "खबरें"}</p>
          {result.rows.length === 0 ? <p className="border p-8 text-center text-neutral-500">{isEn ? "No published news found for this selection." : "इस चयन के लिए कोई प्रकाशित खबर नहीं मिली।"}</p> :
            <ul className="divide-y">
              {result.rows.map((r: any) => (
                <li key={`${r.article_id}-${r.language}`} className="flex gap-3 py-3">
                  {r.cover_path && <img loading="lazy" alt="" width={120} height={80} className="h-20 w-[120px] object-cover"
                    src={sb.storage.from("photos").getPublicUrl(r.cover_path).data.publicUrl} />}
                  <div><Link href={`/news/${r.slug}`} className="font-semibold hover:text-red-700">{r.title}</Link>
                    <time className="block text-xs text-neutral-500" dateTime={r.published_at}>
                      {new Date(r.published_at).toLocaleDateString(r.language === "hi" ? "hi-IN" : "en-IN", { timeZone: "Asia/Kolkata", dateStyle: "long" })}</time></div>
                </li>))}
            </ul>}
          <div className="mt-4 flex justify-between text-sm">
            {result.page > 1 ? <Link href={pageHref(result.page - 1)}>{isEn ? "← Newer" : "← नई खबरें"}</Link> : <span />}
            {result.page < result.pages && <Link href={pageHref(result.page + 1)}>{isEn ? "Older →" : "पुरानी खबरें →"}</Link>}
          </div>
        </section>
      </div>
    </main>
  );
}
