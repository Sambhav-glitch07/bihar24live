import Link from "next/link";

type Props = { year: number; month: number; active: Map<number, number>; qs: string };
const pad = (n: number) => String(n).padStart(2, "0");

export default function ArchiveCalendar({ year, month, active, qs }: Props) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const prev = month === 1 ? [year - 1, 12] : [year, month - 1];
  const next = month === 12 ? [year + 1, 1] : [year, month + 1];
  const href = (y: number, m: number, d?: number) => `/archive/${y}/${pad(m)}${d ? "/" + pad(d) : ""}${qs}`;
  return (
    <div className="w-full max-w-sm border border-neutral-200 p-3" aria-label="Archive calendar">
      <div className="mb-2 flex items-center justify-between text-sm font-semibold">
        <Link href={href(prev[0], prev[1])} aria-label="Previous month">&larr;</Link>
        <span>{pad(month)}/{year}</span>
        <Link href={href(next[0], next[1])} aria-label="Next month">&rarr;</Link>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => <span key={d} className="text-neutral-500">{d}</span>)}
        {cells.map((d, i) => d === null ? <span key={i} /> :
          active.has(d)
            ? <Link key={i} href={href(year, month, d)} title={`${active.get(d)} articles`}
                className="rounded bg-red-700 py-1.5 font-semibold text-white">{d}</Link>
            : <span key={i} className="py-1.5 text-neutral-300" aria-disabled="true">{d}</span>)}
      </div>
    </div>
  );
}
