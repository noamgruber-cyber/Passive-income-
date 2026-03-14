import { createClient } from '@/lib/supabase/server'
import CourseCard from '@/components/CourseCard'
import { CATEGORIES } from '@/types'
import { Course } from '@/types'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('courses')
  return { title: `${t('title')} | LearnHub` }
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const { category, q } = await searchParams
  const supabase = await createClient()
  const t = await getTranslations('courses')

  let query = supabase
    .from('courses')
    .select('*, instructor:profiles(id, full_name, avatar_url), lessons(id)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (q) query = query.ilike('title', `%${q}%`)

  const { data: courses } = await query

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-500">{t('subtitle')}</p>
        </div>

        <form method="GET" className="flex gap-3 mb-8 flex-wrap">
          <input
            name="q"
            defaultValue={q}
            placeholder={t('searchPlaceholder')}
            className="flex-1 min-w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            name="category"
            defaultValue={category || ''}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t('allCategories')}</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            {t('searchButton')}
          </button>
          {(category || q) && (
            <Link href="/courses" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
              {t('clearButton')}
            </Link>
          )}
        </form>

        {courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map(course => (
              <CourseCard key={course.id} course={course as unknown as Course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-500">{t('noResults')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
