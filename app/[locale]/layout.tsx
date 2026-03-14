import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import '../globals.css'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'LearnHub — Learn Anything Online',
  description:
    'Discover thousands of courses from expert instructors. Learn programming, design, business, and more at your own pace.',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as never)) notFound()

  const messages = await getMessages()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  // Arabic uses RTL
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir} className={geist.variable}>
      <body className="antialiased bg-gray-50 text-gray-900 font-sans">
        <NextIntlClientProvider messages={messages}>
          <Navbar user={user} profile={profile} locale={locale} />
          <main>{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
