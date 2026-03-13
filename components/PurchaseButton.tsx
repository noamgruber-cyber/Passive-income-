'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

    if (price === 0) {
      // Free enrollment
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('enrollments').insert({
          user_id: user.id,
          course_id: courseId,
          amount_paid: 0,
        })
        router.push(firstLessonId ? `/courses/${courseSlug}/learn/${firstLessonId}` : '/dashboard')
        router.refresh()
      }
    } else {
      // Paid — redirect to Stripe checkout
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Processing…' : price === 0 ? 'Enroll for Free' : `Buy for ${formatPrice(price)}`}
    </button>
  )
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}
