'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'
import { slugify } from '@/lib/utils'

export default function NewCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    price: '',
    thumbnail_url: '',
    preview_video_url: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const slug = slugify(form.title) + '-' + Math.random().toString(36).slice(2, 7)

    const { data, error: insertError } = await supabase
      .from('courses')
      .insert({
        instructor_id: user.id,
        title: form.title,
        slug,
        description: form.description,
        category: form.category,
        price: parseFloat(form.price) || 0,
        thumbnail_url: form.thumbnail_url || null,
        preview_video_url: form.preview_video_url || null,
        status: 'draft',
      })
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/instructor/courses/${data.id}/edit`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard/instructor" className="text-sm text-gray-500 hover:text-gray-700">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Create New Course</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <Field label="Course Title" required>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
              className="input"
              placeholder="e.g. Complete Python Bootcamp"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder="What will students learn?"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="input"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Price (USD)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                className="input"
                placeholder="0 for free"
              />
            </Field>
          </div>

          <Field label="Thumbnail URL">
            <input
              type="url"
              value={form.thumbnail_url}
              onChange={e => set('thumbnail_url', e.target.value)}
              className="input"
              placeholder="https://…"
            />
          </Field>

          <Field label="Preview Video URL">
            <input
              type="url"
              value={form.preview_video_url}
              onChange={e => set('preview_video_url', e.target.value)}
              className="input"
              placeholder="YouTube or Vimeo URL"
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating…' : 'Create Course & Add Lessons →'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          ring: 2px solid #6366f1;
          border-color: #6366f1;
        }
      `}</style>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
