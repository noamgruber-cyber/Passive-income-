import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'es', 'fr', 'de', 'ar'],
  defaultLocale: 'en',
  // Always prefix, including English: "/" is דניאל עיצוב שיער, which sits
  // outside the locale tree. With 'as-needed', next-intl strips the default
  // locale and /en would redirect onto the salon page.
  localePrefix: 'always', // /en/courses, /es/courses, /fr/courses, etc.
})

export type Locale = (typeof routing.locales)[number]
