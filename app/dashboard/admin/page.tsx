import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

export const metadata = { title: 'Admin Dashboard | LearnHub' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const [
    { count: userCount },
    { count: courseCount },
    { count: enrollmentCount },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }),
    supabase.from('enrollments').select('amount_paid'),
  ])

  const totalRevenue = (revenueData || []).reduce((s, e) => s + (e.amount_paid || 0), 0)
  const platformRevenue = totalRevenue * 0.20

  const stats = [
    { label: 'Total Users', value: userCount ?? 0 },
    { label: 'Total Courses', value: courseCount ?? 0 },
    { label: 'Total Enrollments', value: enrollmentCount ?? 0 },
    { label: 'Platform Revenue (20%)', value: formatPrice(platformRevenue) },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-gray-500">Platform overview and moderation</p>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← My Learning
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard/admin/users"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all group"
          >
            <div className="text-2xl mb-3">👥</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">User Management</h3>
            <p className="mt-1 text-sm text-gray-500">View all users, change roles, manage accounts</p>
          </Link>
          <Link
            href="/dashboard/admin/courses"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all group"
          >
            <div className="text-2xl mb-3">📚</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">Course Moderation</h3>
            <p className="mt-1 text-sm text-gray-500">Review and publish/unpublish courses</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
