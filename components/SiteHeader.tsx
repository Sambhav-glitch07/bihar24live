
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SiteHeader({
  language = "hi",
}: {
  language?: "hi" | "en";
}) {
  let categories: {
    slug: string;
    name_hi: string;
    name_en: string;
  }[] = [];

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("categories")
      .select("slug, name_hi, name_en")
      .order("sort_order")
      .limit(8);

    categories = data ?? [];
  }

  const hindi = language === "hi";

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white shadow-sm">
      <div className="bg-neutral-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs">
          <span>
            {hindi
              ? "बिहार और देश की हर बड़ी खबर"
              : "Bihar and India's latest news"}
          </span>
          <span className="font-semibold tracking-wider">
            {hindi ? "विश्वसनीय खबरें" : "INDEPENDENT JOURNALISM"}
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
        <Link
          href={hindi ? "/hi" : "/en"}
          className="group min-w-0"
        >
          <span className="block text-3xl font-black tracking-[-0.07em] text-neutral-950 sm:text-4xl">
            BIHAR<span className="text-red-700">24</span>
            <span className="ml-1 text-red-700">LIVE</span>
          </span>

          <span className="mt-1 block text-[10px] font-bold tracking-[0.22em] text-neutral-500">
            {hindi
              ? "खबर हर पल, सबसे पहले"
              : "NEWS. PEOPLE. BIHAR."}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-3 text-sm font-bold">
          <Link
            href="/hi"
            className={hindi ? "text-red-700" : "text-neutral-500"}
          >
            हिन्दी
          </Link>

          <span className="text-neutral-300">/</span>

          <Link
            href="/en"
            className={!hindi ? "text-red-700" : "text-neutral-500"}
          >
            ENGLISH
          </Link>
        </div>
      </div>

      <nav className="border-t border-neutral-100">
        <div className="mx-auto flex max-w-7xl items-center gap-7 overflow-x-auto px-4 py-3 whitespace-nowrap">
          <Link
            href={hindi ? "/hi" : "/en"}
            className="text-sm font-extrabold text-red-700"
          >
            {hindi ? "होम" : "HOME"}
          </Link>

          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="text-sm font-bold text-neutral-700 hover:text-red-700"
            >
              {hindi ? category.name_hi : category.name_en}
            </Link>
          ))}

          <Link href="/videos" className="text-sm font-bold">
            {hindi ? "वीडियो" : "VIDEOS"}
          </Link>

          <Link href="/photos" className="text-sm font-bold">
            {hindi ? "फोटो" : "PHOTOS"}
          </Link>

          <Link href="/archive" className="text-sm font-bold">
            {hindi ? "आर्काइव" : "ARCHIVE"}
          </Link>

          <Link href="/search" className="text-sm font-bold">
            {hindi ? "खोजें" : "SEARCH"}
          </Link>
        </div>
      </nav>
    </header>
  );
}
