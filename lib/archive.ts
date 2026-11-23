import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;
const ist = (y: number, m: number, d: number) =>
  new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+05:30`);

export type ArchiveFilters = {
  year?: number; month?: number; day?: number;
  q?: string; lang?: "hi" | "en"; category?: string; district?: string; page?: number;
};

export function dateRange({ year, month, day }: ArchiveFilters) {
  if (!year) return {};
  if (!month) return { from: ist(year, 1, 1), to: ist(year + 1, 1, 1) };
  if (!day) return { from: ist(year, month, 1), to: month === 12 ? ist(year + 1, 1, 1) : ist(year, month + 1, 1) };
  const from = ist(year, month, day);
  return { from, to: new Date(from.getTime() + 86400000) };
}

export async function searchArchive(f: ArchiveFilters) {
  const sb = await createClient();
  const { from, to } = dateRange(f);
  const page = Math.max(1, f.page ?? 1);
  const { data, error } = await sb.rpc("archive_search", {
    p_from: from?.toISOString() ?? null, p_to: to?.toISOString() ?? null,
    p_q: f.q || null, p_lang: f.lang ?? null,
    p_category: f.category || null, p_district: f.district || null,
    p_limit: PAGE_SIZE, p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error) throw error;
  const total = Number(data?.[0]?.total_count ?? 0);
  return { rows: data ?? [], total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getYears() {
  const { data, error } = await (await createClient()).rpc("archive_years");
  if (error) throw error;
  return (data ?? []) as { year: number; total: number }[];
}
export async function getMonthCounts(year: number) {
  const { data, error } = await (await createClient()).rpc("archive_month_counts", { p_year: year });
  if (error) throw error;
  return (data ?? []) as { month: number; total: number }[];
}
export async function getActiveDates(year: number, month: number, lang?: string) {
  const { data, error } = await (await createClient()).rpc("archive_active_dates", { p_year: year, p_month: month, p_lang: lang ?? null });
  if (error) throw error;
  return new Map<number, number>((data ?? []).map((r: { day: string; total: number }) => [Number(r.day.slice(8)), Number(r.total)]));
}
