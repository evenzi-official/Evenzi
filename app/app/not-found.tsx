import Link from "next/link";

export default function AppNotFound() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">404</p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-3 text-gray-600">The page you requested does not exist.</p>
        <Link
          href="/home"
          className="mt-8 inline-block rounded-full bg-gray-900 px-6 py-3 font-semibold text-white hover:bg-gray-800"
        >
          Go to home
        </Link>
      </div>
    </main>
  );
}
