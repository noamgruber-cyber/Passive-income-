import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const config = {
  api: { bodyParser: false },
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.user_id
    const courseId = session.metadata?.course_id
    const amountPaid = session.amount_total ? session.amount_total / 100 : 0

    if (!userId || !courseId) {
      console.error('Missing metadata on session', session.id)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const { error } = await supabase.from('enrollments').upsert(
      {
        user_id: userId,
        course_id: courseId,
        stripe_payment_intent_id: session.payment_intent as string,
        amount_paid: amountPaid,
      },
      { onConflict: 'user_id,course_id' }
    )

    if (error) {
      console.error('Failed to create enrollment:', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    console.log(`Enrolled user ${userId} in course ${courseId}`)
  }

  return NextResponse.json({ received: true })
}
