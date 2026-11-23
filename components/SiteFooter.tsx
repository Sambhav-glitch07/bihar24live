import Link from "next/link";

export default function SiteFooter() {
  return <footer className="mt-16 border-t border-neutral-200 bg-neutral-50">
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-9 sm:grid-cols-2">
      <div><p className="text-xl font-black">BIHAR <span className="text-red-700">24</span> LIVE</p><p className="mt-2 text-sm text-neutral-600">खबर हर पल, सबसे पहले।</p></div>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-700">
        <Link href="/archive">News Archive</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link>
      </nav>
    </div>
    <p className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">© {new Date().getFullYear()} BIHAR 24 LIVE</p>
  </footer>;
}
