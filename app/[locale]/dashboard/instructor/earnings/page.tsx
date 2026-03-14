import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('instructor')
  return { title: `${t('earnings.title')} | LearnHub` }
}

export default async function EarningsPage() {
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
    .select('id, title, slug, status, price, platform_fee_pct')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false })

  const courseIds = courses?.map(c => c.id) || []

  const { data: enrollments } = courseIds.length
    ? await supabase
        .from('enrollments')
        .select('course_id, amount_paid, enrolled_at')
        .in('course_id', courseIds)
        .order('enrolled_at', { ascending: false })
    : { data: [] }

  const courseMap = Object.fromEntries((courses || []).map(c => [c.id, c]))
  const perCourse: Record<string, { title: string; slug: string; status: string; price: number; students: number; grossRevenue: number; netRevenue: number }> = {}

  for (const e of enrollments || []) {
    if (!perCourse[e.course_id]) {
      const c = courseMap[e.course_id]
      perCourse[e.course_id] = {
        title: c?.title || 'Unknown',
        slug: c?.slug || '',
        status: c?.status || 'draft',
        price: c?.price || 0,
        students: 0,
        grossRevenue: 0,
        netRevenue: 0,
      }
    }
    const platformPct = courseMap[e.course_id]?.platform_fee_pct ?? 20
    const gross = e.amount_paid || 0
    perCourse[e.course_id].students += 1
    perCourse[e.course_id].grossRevenue += gross
    perCourse[e.course_id].netRevenue += gross * (1 - platformPct / 100)
  }

  const totalGross = Object.values(perCourse).reduce((s, c) => s + c.grossRevenue, 0)
  const totalNet = Object.values(perCourse).reduce((s, c) => s + c.netRevenue, 0)
  const totalStudents = Object.values(perCourse).reduce((s, c) => s + c.students, 0)

  const recentSales = (enrollments || [])
    .filter(e => (e.amount_paid || 0) > 0)
    .slice(0, 10)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard/instructor" className="text-sm text-gray-500 hover:text-gray-700">
            ← {t('dashboard.title')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('earnings.title')}</h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('earnings.stats.students'), value: totalStudents },
            { label: t('earnings.stats.gross'), value: formatPrice(totalGross) },
            { label: t('earnings.stats.platformFee'), value: formatPrice(totalGross - totalNet) },
            { label: t('earnings.stats.yours'), value: formatPrice(totalNet), highlight: true },
          ].map(stat => (
            <div
              key={stat.label}
              className={`rounded-xl border p-5 ${stat.highlight ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200'}`}
            >
              <p className={`text-sm ${stat.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>{stat.label}</p>
              <p className={`mt-1 text-2xl font-bold ${stat.highlight ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{t('earnings.byCourse')}</h2>
          </div>
          {Object.keys(perCourse).length === 0 ? (
            <div className="text-center py-12 text-gray-400">{t('earnings.noSales')}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('earnings.table.course')}</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('earnings.table.students')}</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('earnings.table.gross')}</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('earnings.table.yourCut')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(perCourse).map(([id, c]) => (
                  <tr key={id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{c.title}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${c.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700">{c.students}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-700">{formatPrice(c.grossRevenue)}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-indigo-600">{formatPrice(c.netRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {recentSales.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{t('earnings.recentSales')}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentSales.map((e, i) => {
                const c = courseMap[e.course_id]
                const platformPct = c?.platform_fee_pct ?? 20
                const gross = e.amount_paid || 0
                const net = gross * (1 - platformPct / 100)
                return (
                  <div key={i} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c?.title || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(e.enrolled_at).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-indigo-600">{formatPrice(net)}</p>
                      <p className="text-xs text-gray-400">{t('earnings.of', { gross: formatPrice(gross) })}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
