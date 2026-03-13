import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'LearnHub — Learn Anything Online',
  description:
    'Discover thousands of courses from expert instructors. Learn programming, design, business, and more at your own pace.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  return (
    <html lang="en" className={geist.variable}>
      <body className="antialiased bg-gray-50 text-gray-900 font-sans">
        <Navbar user={user} profile={profile} />
        <main>{children}</main>
      </body>
    </html>
  )
}
