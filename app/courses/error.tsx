'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function CoursesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-xl font-bold text-gray-900">Failed to load courses</h2>
        <p className="mt-2 text-gray-500 text-sm">There was a problem connecting to the server.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Try again
          </button>
          <Link href="/" className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
