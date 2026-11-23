import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SiteHeader({ language = "hi" }: { language?: "hi" | "en" }) {
  let categories: { slug: string; name_hi: string; name_en: string }[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const supabase = await createClient();
    const { data } = await supabase.from("categories").select("slug, name_hi, name_en").order("sort_order").limit(8);
    categories = data ?? [];
  }
  const fixedLinks = [
    [language === "hi" ? "वीडियो" : "Videos", "/videos"],
    [language === "hi" ? "फोटो" : "Photos", "/photos"],
    [language === "hi" ? "आर्काइव" : "Archive", "/archive"],
    [language === "hi" ? "खोजें" : "Search", "/search"]
  ] as const;
  return <header className="border-b border-neutral-200 bg-white">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
      <Link href={language === "hi" ? "/hi" : "/en"} className="min-w-0">
        <span className="block text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">BIHAR <span className="text-red-700">24</span> LIVE</span>
        <span className="text-xs font-medium tracking-wide text-neutral-600">{language === "hi" ? "खबर हर पल, सबसे पहले।" : "NEWS. PEOPLE. BIHAR."}</span>
      </Link>
      <div className="flex shrink-0 items-center gap-3 text-sm font-semibold">
        <Link href="/hi" aria-label="Hindi">हिन्दी</Link><span className="text-neutral-300">|</span><Link href="/en" aria-label="English">EN</Link>
      </div>
    </div>
    <nav aria-label="Main navigation" className="border-t border-neutral-100">
      <div className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 py-3 text-sm font-semibold whitespace-nowrap">
        {categories.map((category) => <Link key={category.slug} href={`/category/${category.slug}`} className="hover:text-red-700">{language === "hi" ? category.name_hi : category.name_en}</Link>)}
        {fixedLinks.map(([label, href]) => <Link key={href} href={href} className="hover:text-red-700">{label}</Link>)}
      </div>
    </nav>
  </header>;
}
