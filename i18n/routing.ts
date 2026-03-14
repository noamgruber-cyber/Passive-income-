import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'es', 'fr', 'de', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // /courses (en), /es/courses, /fr/courses, etc.
})

export type Locale = (typeof routing.locales)[number]
