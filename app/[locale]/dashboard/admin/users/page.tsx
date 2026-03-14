import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminRoleForm from '@/app/dashboard/admin/users/AdminRoleForm'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('admin')
  return { title: `${t('users.title')} | LearnHub` }
}

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = await getTranslations('admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard/admin" className="text-sm text-gray-500 hover:text-gray-700">
            ← {t('dashboard.title')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('users.table.user')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('users.table.role')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('users.table.joined')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('users.table.changeRole')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(users || []).map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{u.full_name || '(no name)'}</p>
                    <p className="text-xs text-gray-400 font-mono">{u.id.slice(0, 8)}…</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.role === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : u.role === 'instructor'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    {u.id !== user.id && (
                      <AdminRoleForm userId={u.id} currentRole={u.role} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
