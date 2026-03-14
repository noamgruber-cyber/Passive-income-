import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-indigo-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-gray-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/courses"
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Browse courses
          </Link>
        </div>
      </div>
    </div>
  )
}
