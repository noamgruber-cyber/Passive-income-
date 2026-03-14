import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('instructor')
  return { title: `${t('dashboard.title')} | LearnHub` }
}

export default async function InstructorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('instructor')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'instructor' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, slug, status, price, created_at')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false })

  const courseIds = courses?.map(c => c.id) || []
  const { data: enrollments } = courseIds.length
    ? await supabase
        .from('enrollments')
        .select('amount_paid, course_id')
        .in('course_id', courseIds)
    : { data: [] }

  const totalRevenue = enrollments?.reduce((sum, e) => sum + (e.amount_paid || 0), 0) || 0
  const platformCut = totalRevenue * 0.2
  const netRevenue = totalRevenue - platformCut
  const totalStudents = enrollments?.length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            <p className="mt-1 text-gray-500">{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/instructor/earnings"
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {t('dashboard.earnings')}
            </Link>
            <Link
              href="/dashboard/instructor/courses/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {t('dashboard.newCourse')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('dashboard.stats.courses'), value: courses?.length || 0 },
            { label: t('dashboard.stats.students'), value: totalStudents },
            { label: t('dashboard.stats.gross'), value: formatPrice(totalRevenue) },
            { label: t('dashboard.stats.net'), value: formatPrice(netRevenue) },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{t('dashboard.myCourses')}</h2>
          </div>
          {!courses || courses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 mb-4">{t('dashboard.noCourses')}</p>
              <Link
                href="/dashboard/instructor/courses/new"
                className="text-indigo-600 font-medium hover:underline"
              >
                {t('dashboard.createFirst')}
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('dashboard.table.title')}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('dashboard.table.status')}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('dashboard.table.price')}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('dashboard.table.students')}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('dashboard.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map(course => {
                  const courseEnrollments = enrollments?.filter(e => e.course_id === course.id).length || 0
                  return (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 text-sm">{course.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          course.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatPrice(course.price)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{courseEnrollments}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/instructor/courses/${course.id}/edit`}
                          className="text-sm text-indigo-600 hover:underline font-medium"
                        >
                          {t('dashboard.edit')}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
