import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId } = await request.json()

  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 })
  }

  // Verify course is free and published
  const { data: course } = await supabase
    .from('courses')
    .select('id, price, slug, lessons(id, sort_order)')
    .eq('id', courseId)
    .eq('status', 'published')
    .single()

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  if (course.price > 0) {
    return NextResponse.json({ error: 'This course requires payment' }, { status: 400 })
  }

  // Idempotent: check if already enrolled
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (existing) {
    // Already enrolled — return first lesson to redirect to
    const lessons = (course.lessons as { id: string; sort_order: number }[])
      .sort((a, b) => a.sort_order - b.sort_order)
    return NextResponse.json({ alreadyEnrolled: true, firstLessonId: lessons[0]?.id || null })
  }

  const { error } = await supabase.from('enrollments').insert({
    user_id: user.id,
    course_id: courseId,
    amount_paid: 0,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const lessons = (course.lessons as { id: string; sort_order: number }[])
    .sort((a, b) => a.sort_order - b.sort_order)

  return NextResponse.json({ success: true, firstLessonId: lessons[0]?.id || null })
}
