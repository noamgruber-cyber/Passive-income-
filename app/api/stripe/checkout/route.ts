import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId } = await request.json()

    // Fetch course
    const { data: course, error } = await supabase
      .from('courses')
      .select('id, title, price, slug, thumbnail_url')
      .eq('id', courseId)
      .eq('status', 'published')
      .single()

    if (error || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (course.price === 0) {
      return NextResponse.json({ error: 'Free courses do not require checkout' }, { status: 400 })
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(course.price * 100),
            product_data: {
              name: course.title,
              images: course.thumbnail_url ? [course.thumbnail_url] : [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        course_id: course.id,
      },
      success_url: `${origin}/courses/${course.slug}?success=true`,
      cancel_url: `${origin}/courses/${course.slug}?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
