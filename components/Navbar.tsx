'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import LanguageSwitcher from './LanguageSwitcher'

interface NavbarProps {
  user: { email?: string } | null
  profile: Profile | null
}

export default function Navbar({ user, profile }: NavbarProps) {
  const router = useRouter()
  const t = useTranslations('nav')

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              LearnHub
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/courses" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                {t('browseCourses')}
              </Link>
              {profile?.role === 'instructor' && (
                <Link href="/dashboard/instructor" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                  {t('teach')}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-700 font-medium hover:text-gray-900"
                >
                  {t('myLearning')}
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  {t('settings')}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  {t('signOut')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-700 font-medium hover:text-gray-900"
                >
                  {t('signIn')}
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  {t('getStarted')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
