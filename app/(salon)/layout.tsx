import type { Metadata } from 'next'
import { Assistant, Frank_Ruhl_Libre } from 'next/font/google'
import { ADDRESS, BIZ_NAME, PHONE_DISPLAY } from '@/lib/salon/data'

// Its own root layout: Hebrew, RTL, paper background, and none of the
// Tailwind/LearnHub chrome from app/[locale]/layout.tsx.

// Body: Assistant — the most comfortable Hebrew UI face at length.
// Display and prices: Frank Ruhl Libre — the Hebrew book serif, which reads as
// record-keeping next to the blocks of the rail. See design/design-plan.md §3.
const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--ds-font-body',
  display: 'swap',
})

const frankRuhlLibre = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--ds-font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${BIZ_NAME} — ${ADDRESS}`,
  description:
    'כיסא אחד, ספר אחד. השעות הפנויות אצל דניאל מופיעות באתר — בוחרים שעה, וזה נסגר. ' +
    `${ADDRESS} · ${PHONE_DISPLAY}`,
}

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${assistant.variable} ${frankRuhlLibre.variable}`}>
      <body style={{ margin: 0, padding: 0, background: '#F6F1E8', color: '#1C1A17' }}>
        {children}
      </body>
    </html>
  )
}
