import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminCourseActions from '@/app/dashboard/admin/courses/AdminCourseActions'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('admin')
  return { title: `${t('courses.title')} | LearnHub` }
}

export default async function AdminCoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: courses } = await supabase
    .from('courses')
    .select(`
      id, title, slug, status, price, created_at,
      instructor:profiles(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard/admin" className="text-sm text-gray-500 hover:text-gray-700">
            ← {t('dashboard.title')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('courses.title')}</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('courses.table.course')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('courses.table.instructor')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('courses.table.price')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('courses.table.status')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('courses.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(courses || []).map(course => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{course.title}</p>
                    <p className="text-xs text-gray-400">{course.slug}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(course.instructor as unknown as { full_name: string } | null)?.full_name || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      course.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <AdminCourseActions courseId={course.id} currentStatus={course.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
