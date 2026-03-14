import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatPrice, formatDuration } from '@/lib/utils'
import PurchaseButton from '@/components/PurchaseButton'
import CheckoutBanner from '@/components/CheckoutBanner'
import Image from 'next/image'
import { Suspense } from 'react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: course } = await supabase
    .from('courses')
    .select('title, description')
    .eq('slug', slug)
    .single()
  return {
    title: course ? `${course.title} | LearnHub` : 'Course Not Found',
    description: course?.description,
  }
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select(`
      *,
      instructor:profiles(id, full_name, avatar_url),
      lessons(id, title, duration_seconds, sort_order, is_free_preview)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!course) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  let isEnrolled = false
  if (user) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .single()
    isEnrolled = !!enrollment
  }

  const lessons = (course.lessons as Array<{
    id: string; title: string; duration_seconds: number; sort_order: number; is_free_preview: boolean
  }>).sort((a, b) => a.sort_order - b.sort_order)

  const totalDuration = lessons.reduce((sum, l) => sum + (l.duration_seconds || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <CheckoutBanner />
      </Suspense>
      {/* Hero */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="text-indigo-400 text-sm font-medium uppercase tracking-wide">
                {course.category}
              </span>
              {course.level && (
                <span className="text-xs font-medium bg-white/10 text-gray-300 px-2 py-0.5 rounded capitalize">
                  {course.level}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-bold">{course.title}</h1>
            <p className="mt-4 text-gray-300 leading-relaxed">{course.description}</p>
            <p className="mt-4 text-sm text-gray-400">
              Instructor:{' '}
              <span className="text-white font-medium">
                {(course.instructor as { full_name: string })?.full_name || 'Instructor'}
              </span>
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
              <span>{lessons.length} lessons</span>
              {totalDuration > 0 && <span>{formatDuration(totalDuration)} total</span>}
            </div>
          </div>

          {/* Purchase Card */}
          <div className="bg-white text-gray-900 rounded-xl p-6 shadow-xl h-fit">
            {course.thumbnail_url && (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
              </div>
            )}
            <div className="text-3xl font-bold mb-4">{formatPrice(course.price)}</div>
            <PurchaseButton
              courseId={course.id}
              courseSlug={course.slug}
              price={course.price}
              isEnrolled={isEnrolled}
              isLoggedIn={!!user}
              firstLessonId={lessons[0]?.id}
            />
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span>✓</span> {lessons.length} lessons
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span> Lifetime access
              </li>
              <li className="flex items-center gap-2">
                <span>✓</span> Certificate of completion
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-3xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Course Curriculum</h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {lessons.map((lesson, i) => (
            <div key={lesson.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-5">{i + 1}</span>
                <span className="text-sm font-medium text-gray-900">{lesson.title}</span>
                {lesson.is_free_preview && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                    Preview
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {lesson.duration_seconds > 0 ? formatDuration(lesson.duration_seconds) : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
