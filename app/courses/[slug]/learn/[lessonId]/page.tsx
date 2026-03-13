import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import VideoPlayer from '@/components/VideoPlayer'
import LessonSidebar from '@/components/LessonSidebar'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string; lessonId: string }>
}

export default async function LessonPage({ params }: PageProps) {
  const { slug, lessonId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/courses/${slug}/learn/${lessonId}`)

  // Fetch course
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, lessons(*)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!course) notFound()

  // Check enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()

  if (!enrollment) redirect(`/courses/${slug}`)

  // Fetch current lesson
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .eq('course_id', course.id)
    .single()

  if (!lesson) notFound()

  // Fetch progress
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)

  const lessons = course.lessons as Array<{
    id: string; title: string; video_url: string | null; duration_seconds: number; sort_order: number; is_free_preview: boolean; course_id: string; created_at: string
  }>
  const sortedLessons = [...lessons].sort((a, b) => a.sort_order - b.sort_order)
  const currentIndex = sortedLessons.findIndex(l => l.id === lessonId)
  const nextLesson = sortedLessons[currentIndex + 1]
  const prevLesson = sortedLessons[currentIndex - 1]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <Link href={`/courses/${slug}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← {course.title}
        </Link>
        <span className="text-gray-300">|</span>
        <span className="text-sm font-medium text-gray-900">{lesson.title}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3 space-y-4">
          {lesson.video_url ? (
            <VideoPlayer
              url={lesson.video_url}
              lessonId={lesson.id}
            />
          ) : (
            <div className="bg-gray-200 rounded-xl aspect-video flex items-center justify-center">
              <p className="text-gray-500">No video for this lesson</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h1 className="text-xl font-bold text-gray-900">{lesson.title}</h1>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            {prevLesson ? (
              <Link
                href={`/courses/${slug}/learn/${prevLesson.id}`}
                className="text-sm bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Previous
              </Link>
            ) : <div />}
            {nextLesson && (
              <Link
                href={`/courses/${slug}/learn/${nextLesson.id}`}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Next lesson →
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <LessonSidebar
            lessons={sortedLessons as import('@/types').Lesson[]}
            progress={progress || []}
            currentLessonId={lessonId}
            courseSlug={slug}
          />
        </div>
      </div>
    </div>
  )
}
