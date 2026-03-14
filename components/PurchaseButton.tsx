'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PurchaseButtonProps {
  courseId: string
  courseSlug: string
  price: number
  isEnrolled: boolean
  isLoggedIn: boolean
  firstLessonId?: string
}

export default function PurchaseButton({
  courseId,
  courseSlug,
  price,
  isEnrolled,
  isLoggedIn,
  firstLessonId,
}: PurchaseButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isEnrolled && firstLessonId) {
    return (
      <Link
        href={`/courses/${courseSlug}/learn/${firstLessonId}`}
        className="block w-full text-center bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
      >
        Continue Learning →
      </Link>
    )
  }

  if (!isLoggedIn) {
    return (
      <Link
        href={`/register?redirect=/courses/${courseSlug}`}
        className="block w-full text-center bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        {price === 0 ? 'Enroll for Free' : `Buy for ${formatPrice(price)}`}
      </Link>
    )
  }

  const handlePurchase = async () => {
    setLoading(true)
    setError('')

    if (price === 0) {
      // Free enrollment via server API
      const res = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const data = await res.json()
      if (res.ok) {
        const lessonId = data.firstLessonId
        router.push(lessonId ? `/courses/${courseSlug}/learn/${lessonId}` : '/dashboard')
        router.refresh()
      } else {
        setError(data.error || 'Enrollment failed')
        setLoading(false)
      }
    } else {
      // Paid — redirect to Stripe checkout
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const data = await res.json()
      if (res.status === 409) {
        // Already enrolled — refresh to show updated state
        router.refresh()
      } else if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Checkout failed')
        setLoading(false)
      }
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-2 text-sm text-red-600">{error}</p>
      )}
      <button
        onClick={handlePurchase}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Processing…' : price === 0 ? 'Enroll for Free' : `Buy for ${formatPrice(price)}`}
      </button>
    </div>
  )
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}
