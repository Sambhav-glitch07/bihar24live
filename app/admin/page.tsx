import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role, display_name").eq("id", user.id).maybeSingle();
  if (profile?.role !== "owner") redirect("/admin/login?error=not-owner");
  const [published, drafts, scheduled, videos, photos] = await Promise.all([
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("videos").select("id", { count: "exact", head: true }),
    supabase.from("media").select("id", { count: "exact", head: true }).eq("kind", "image")
  ]);
  const cards = [["Published articles", published.count], ["Drafts", drafts.count], ["Scheduled", scheduled.count], ["Videos", videos.count], ["Photos", photos.count]] as const;
  return <main className="mx-auto max-w-7xl px-4 py-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-widest text-red-700">PRIVATE NEWSROOM</p><h1 className="mt-1 text-3xl font-black">Dashboard</h1><p className="mt-1 text-sm text-neutral-600">{profile.display_name || user.email}</p></div><form action="/auth/signout" method="post"><button className="border px-4 py-2 text-sm font-semibold">Sign out</button></form></div><section className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{cards.map(([label, count]) => <div key={label} className="border border-neutral-200 p-4"><p className="text-sm text-neutral-600">{label}</p><p className="mt-2 text-3xl font-black">{count ?? "—"}</p></div>)}</section><section className="mt-8"><h2 className="text-lg font-bold">Newsroom modules</h2><p className="mt-1 text-sm text-neutral-600">The dashboard shell is in place. These modules are not implemented yet and are intentionally disabled.</p><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{["Write a news report", "Manage news", "Breaking news", "Media library", "Archive management", "Website settings"].map(label => <div key={label} aria-disabled="true" className="border border-dashed border-neutral-300 p-4 text-neutral-500"><p className="font-semibold">{label}</p><p className="mt-1 text-xs">Not implemented yet</p></div>)}</div></section></main>;
}
