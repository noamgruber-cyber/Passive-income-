'use client'

import dynamic from 'next/dynamic'

// Client-only: the rail is drawn against the visitor's own clock, so rendering
// it on the server would hydrate against a different "now" (and a different
// timezone) and mismatch every slot.
const SalonHome = dynamic(() => import('@/components/salon/SalonHome'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '100vh', background: '#F6F1E8' }} />,
})

export default function Page() {
  return <SalonHome />
}
