import Link from 'next/link'

export function PageFooter() {
  return (
    <footer className="w-full mt-20 border-t border-gray-200 dark:border-neutral-800">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="w-9 h-9 shrink-0 rounded-full bg-[#BB0020] text-white inline-flex items-center justify-center text-sm font-bold"
          >
            E
          </span>
          <p className="text-sm text-gray-500 font-semibold">© 2026 Evenzi · Capture · Share · Cherish</p>
        </div>
        <div className="flex items-center gap-6 text-xs font-bold tracking-widest text-gray-400 uppercase">
          <Link href="/legal/privacy" className="hover:text-[#BB0020] transition-colors">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-[#BB0020] transition-colors">Terms</Link>
          <a href="mailto:evenzi.official@gmail.com" className="hover:text-[#BB0020] transition-colors">Help</a>
        </div>
      </div>
    </footer>
  )
}
