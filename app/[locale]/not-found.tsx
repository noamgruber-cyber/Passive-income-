import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function NotFound() {
  const t = await getTranslations('notFound')
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-indigo-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-2 text-gray-500">{t('subtitle')}</p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            {t('goHome')}
          </Link>
          <Link href="/courses" className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            {t('browseCourses')}
          </Link>
        </div>
      </div>
    </div>
  )
}
