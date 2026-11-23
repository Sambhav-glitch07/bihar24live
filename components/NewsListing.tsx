import Link from "next/link";
export default function NewsListing({ title, rows, empty }: { title: string; rows: { id: string; slug: string; title: string; description?: string | null }[]; empty: string }) {
  return <main className="mx-auto min-h-[55vh] max-w-6xl px-4 py-8"><h1 className="border-b border-neutral-200 pb-4 text-3xl font-black">{title}</h1>{rows.length === 0 ? <p className="mt-8 border p-10 text-center text-neutral-500">{empty}</p> : <div className="mt-6 divide-y divide-neutral-200">{rows.map(row => <article key={row.id} className="py-5"><Link href={`/news/${row.slug}`} className="text-xl font-bold hover:text-red-700">{row.title}</Link>{row.description && <p className="mt-2 text-sm leading-6 text-neutral-600">{row.description}</p>}</article>)}</div>}</main>;
}
