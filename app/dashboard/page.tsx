import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProgressBar from '@/components/ProgressBar'

export const metadata = { title: 'My Learning | LearnHub' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch enrollments with course + lessons (sorted by sort_order)
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(
        id, title, slug, thumbnail_url, category,
        lessons(id, sort_order)
      )
    `)
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })

  // Fetch all completed lesson progress
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed')
    .eq('user_id', user.id)
    .eq('completed', true)

  const completedLessonIds = new Set(progress?.map(p => p.lesson_id) || [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Learner'}
          </h1>
          <p className="mt-1 text-gray-500">Continue where you left off</p>
        </div>

        {profile?.role === 'instructor' && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-medium text-indigo-900">You&apos;re an instructor</p>
              <p className="text-sm text-indigo-600">Manage your courses and track earnings</p>
            </div>
            <Link
              href="/dashboard/instructor"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Instructor Dashboard →
            </Link>
          </div>
        )}

        {profile?.role === 'admin' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-medium text-red-900">Admin Panel</p>
              <p className="text-sm text-red-600">Manage users and moderate courses</p>
            </div>
            <Link
              href="/dashboard/admin"
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Admin Dashboard →
            </Link>
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Courses</h2>

        {!enrollments || enrollments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-gray-500 mb-4">You haven&apos;t enrolled in any courses yet</p>
            <Link
              href="/courses"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map(enrollment => {
              const course = enrollment.course as {
                id: string; title: string; slug: string; thumbnail_url: string | null; category: string;
                lessons: { id: string; sort_order: number }[]
              }
              if (!course) return null

              const sortedLessons = [...(course.lessons || [])].sort((a, b) => a.sort_order - b.sort_order)
              const totalLessons = sortedLessons.length
              const completedCount = sortedLessons.filter(l => completedLessonIds.has(l.id)).length
              // First lesson that hasn't been completed yet
              const nextLesson = sortedLessons.find(l => !completedLessonIds.has(l.id)) ?? sortedLessons[0]
              const learnHref = nextLesson
                ? `/courses/${course.slug}/learn/${nextLesson.id}`
                : `/courses/${course.slug}`

              return (
                <div key={enrollment.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="relative aspect-video bg-gray-100">
                    {course.thumbnail_url ? (
                      <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                        <span className="text-3xl">📚</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                      {course.category}
                    </span>
                    <h3 className="mt-1 font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
                    <div className="mt-3">
                      <ProgressBar completed={completedCount} total={totalLessons} />
                    </div>
                    <Link
                      href={learnHref}
                      className="mt-3 block text-center bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      {completedCount > 0 && completedCount < totalLessons
                        ? 'Continue Learning'
                        : completedCount === totalLessons && totalLessons > 0
                        ? 'Review Course'
                        : 'Start Learning'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
