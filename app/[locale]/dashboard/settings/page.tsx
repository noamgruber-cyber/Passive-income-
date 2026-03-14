import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/app/dashboard/settings/ProfileForm'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('settings')
  return { title: `${t('title')} | LearnHub` }
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('settings')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>
        <ProfileForm
          userId={user.id}
          initialName={profile?.full_name || ''}
          initialAvatar={profile?.avatar_url || ''}
          email={user.email || ''}
          role={profile?.role || 'student'}
        />
      </div>
    </div>
  )
}
