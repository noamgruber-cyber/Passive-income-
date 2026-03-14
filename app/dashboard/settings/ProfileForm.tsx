'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface ProfileFormProps {
  userId: string
  initialName: string
  initialAvatar: string
  email: string
  role: string
}

export default function ProfileForm({ userId, initialName, initialAvatar, email, role }: ProfileFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [avatar, setAvatar] = useState(initialAvatar)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), avatar_url: avatar.trim() || null })
      .eq('id', userId)

    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg('Profile saved!')
      router.refresh()
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-100 overflow-hidden relative flex-shrink-0">
          {avatar ? (
            <Image src={avatar} alt="Avatar" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-indigo-600 text-xl font-bold">
              {name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{name || '(no name)'}</p>
          <p className="text-sm text-gray-500">{email}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            role === 'admin' ? 'bg-red-100 text-red-700' :
            role === 'instructor' ? 'bg-indigo-100 text-indigo-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {role}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {msg && (
          <p className={`text-sm font-medium ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {msg}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
          <input
            type="url"
            value={avatar}
            onChange={e => setAvatar(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="https://example.com/avatar.jpg"
          />
          <p className="mt-1 text-xs text-gray-400">Paste a direct image URL (Gravatar, LinkedIn, etc.)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-400">Email cannot be changed here</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
