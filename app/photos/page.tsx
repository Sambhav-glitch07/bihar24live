import { createClient } from "@/lib/supabase/server";
export const revalidate = 60;
export default async function PhotosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("media").select("id, storage_path, caption_hi, alt_hi").eq("kind", "image").order("created_at", { ascending: false }).limit(60);
  return <main className="mx-auto min-h-[55vh] max-w-6xl px-4 py-8"><h1 className="border-b border-neutral-200 pb-4 text-3xl font-black">फोटो गैलरी</h1>{error ? <p className="mt-6 text-red-700">Photos could not be loaded.</p> : !data?.length ? <p className="mt-8 border p-10 text-center text-neutral-500">अभी कोई फोटो उपलब्ध नहीं है।</p> : <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{data.map(photo => <figure key={photo.id}><img loading="lazy" src={supabase.storage.from("photos").getPublicUrl(photo.storage_path).data.publicUrl} alt={photo.alt_hi || photo.caption_hi || "BIHAR 24 LIVE news photograph"} className="aspect-[4/3] w-full object-cover" />{photo.caption_hi && <figcaption className="mt-1 text-sm">{photo.caption_hi}</figcaption>}</figure>)}</div>}</main>;
}
