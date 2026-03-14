'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { routing } from '@/i18n/routing'

const LOCALE_LABELS: Record<string, string> = {
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  ar: 'AR',
}

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (next: string) => {
    // Strip current locale prefix from pathname
    const segments = pathname.split('/')
    // If first segment is a known locale, replace it; otherwise prepend new locale
    const isLocaleSegment = routing.locales.includes(segments[1] as typeof routing.locales[number])
    let newPath: string

    if (isLocaleSegment) {
      segments[1] = next === routing.defaultLocale ? '' : next
      newPath = segments.filter((s, i) => i !== 1 || s !== '').join('/')
    } else {
      newPath = next === routing.defaultLocale ? pathname : `/${next}${pathname}`
    }

    router.push(newPath || '/')
    router.refresh()
  }

  return (
    <select
      value={locale}
      onChange={e => switchLocale(e.target.value)}
      className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
      aria-label="Language"
    >
      {routing.locales.map(l => (
        <option key={l} value={l}>{LOCALE_LABELS[l] ?? l.toUpperCase()}</option>
      ))}
    </select>
  )
}
