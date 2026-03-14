'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CheckoutBanner() {
  const params = useSearchParams()
  const [banner, setBanner] = useState<{ type: 'success' | 'cancel'; msg: string } | null>(null)

  useEffect(() => {
    if (params.get('success') === 'true') {
      setBanner({ type: 'success', msg: 'Payment successful! You are now enrolled. Start learning below.' })
    } else if (params.get('canceled') === 'true') {
      setBanner({ type: 'cancel', msg: 'Payment was canceled. Your card was not charged.' })
    }
  }, [params])

  if (!banner) return null

  return (
    <div className={`px-4 py-3 text-sm font-medium text-center ${
      banner.type === 'success'
        ? 'bg-green-50 text-green-800 border-b border-green-200'
        : 'bg-yellow-50 text-yellow-800 border-b border-yellow-200'
    }`}>
      {banner.type === 'success' ? '✓ ' : '⚠ '}{banner.msg}
    </div>
  )
}
