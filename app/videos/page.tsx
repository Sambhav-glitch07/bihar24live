import { createClient } from "@/lib/supabase/server";
export const revalidate = 60;
export default async function VideosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("videos").select("id, title_hi, description_hi, cloudinary_public_id, published_at").eq("status", "published").order("published_at", { ascending: false }).limit(30);
  return <main className="mx-auto min-h-[55vh] max-w-6xl px-4 py-8"><h1 className="border-b border-neutral-200 pb-4 text-3xl font-black">वीडियो न्यूज़</h1>{error ? <p className="mt-6 text-red-700">Videos could not be loaded.</p> : !data?.length ? <p className="mt-8 border p-10 text-center text-neutral-500">अभी कोई वीडियो प्रकाशित नहीं हुआ है।</p> : <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.map(v => <article key={v.id} className="border border-neutral-200 p-3"><div className="aspect-video bg-neutral-100"><video controls preload="metadata" className="h-full w-full"><source src={`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/${v.cloudinary_public_id}.mp4`} type="video/mp4" /></video></div><h2 className="mt-3 font-bold">{v.title_hi}</h2>{v.description_hi && <p className="mt-1 text-sm text-neutral-600">{v.description_hi}</p>}</article>)}</div>}</main>;
}
