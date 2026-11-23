import { notFound } from "next/navigation";
import NewsListing from "@/components/NewsListing";
import { getPublishedListing } from "@/lib/public-content";
export const revalidate = 60;
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const { term, rows } = await getPublishedListing("category", slug, "hi"); if (!term) notFound();
  return <NewsListing title={term.name_hi} rows={rows as unknown as { id: string; slug: string; title: string; description?: string | null }[]} empty="इस श्रेणी में अभी कोई खबर प्रकाशित नहीं हुई है।" />;
}
