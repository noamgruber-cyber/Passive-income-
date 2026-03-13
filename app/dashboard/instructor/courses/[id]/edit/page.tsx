'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'
import { slugify } from '@/lib/utils'

interface Lesson {
  id: string
  title: string
  video_url: string | null
  duration_seconds: number
  sort_order: number
  is_free_preview: boolean
}

interface CourseForm {
  title: string
  description: string
  category: string
  price: string
  thumbnail_url: string
  status: 'draft' | 'published'
}

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState<CourseForm>({
    title: '', description: '', category: CATEGORIES[0],
    price: '0', thumbnail_url: '', status: 'draft',
  })
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [newLesson, setNewLesson] = useState({ title: '', video_url: '', is_free_preview: false })
  const [addingLesson, setAddingLesson] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: course } = await supabase.from('courses').select('*').eq('id', id).single()
      if (!course) { router.push('/dashboard/instructor'); return }
      setForm({
        title: course.title,
        description: course.description || '',
        category: course.category,
        price: String(course.price),
        thumbnail_url: course.thumbnail_url || '',
        status: course.status,
      })
      const { data: ls } = await supabase.from('lessons').select('*').eq('course_id', id).order('sort_order')
      setLessons(ls || [])
    }
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const saveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('courses').update({
      title: form.title,
      description: form.description,
      category: form.category,
      price: parseFloat(form.price) || 0,
      thumbnail_url: form.thumbnail_url || null,
      status: form.status,
    }).eq('id', id)
    setMsg('Saved!')
    setTimeout(() => setMsg(''), 3000)
    setSaving(false)
  }

  const addLesson = async () => {
    if (!newLesson.title.trim()) return
    setAddingLesson(true)
    const { data } = await supabase.from('lessons').insert({
      course_id: id,
      title: newLesson.title,
      video_url: newLesson.video_url || null,
      sort_order: lessons.length,
      is_free_preview: newLesson.is_free_preview,
      duration_seconds: 0,
    }).select().single()
    if (data) setLessons(l => [...l, data])
    setNewLesson({ title: '', video_url: '', is_free_preview: false })
    setAddingLesson(false)
  }

  const deleteLesson = async (lessonId: string) => {
    await supabase.from('lessons').delete().eq('id', lessonId)
    setLessons(l => l.filter(x => x.id !== lessonId))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/instructor" className="text-sm text-gray-500 hover:text-gray-700">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Edit Course</h1>
        </div>

        {/* Course form */}
        <form onSubmit={saveCourse} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Course Details</h2>
          {msg && <p className="text-green-600 text-sm font-medium">{msg}</p>}

          <div>
            <label className="label">Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required className="input" />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="input resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Price (USD)</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Thumbnail URL</label>
            <input type="url" value={form.thumbnail_url} onChange={e => set('thumbnail_url', e.target.value)} className="input" placeholder="https://…" />
          </div>

          <div>
            <label className="label">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>

        {/* Lessons */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Lessons ({lessons.length})</h2>

          <div className="space-y-2 mb-6">
            {lessons.map((lesson, i) => (
              <div key={lesson.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-400 w-5">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                  {lesson.video_url && (
                    <p className="text-xs text-gray-400 truncate">{lesson.video_url}</p>
                  )}
                </div>
                {lesson.is_free_preview && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Preview</span>
                )}
                <button
                  onClick={() => deleteLesson(lesson.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {/* Add lesson */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Add Lesson</h3>
            <input
              placeholder="Lesson title"
              value={newLesson.title}
              onChange={e => setNewLesson(n => ({ ...n, title: e.target.value }))}
              className="input w-full"
            />
            <input
              placeholder="Video URL (YouTube, Vimeo, or direct)"
              value={newLesson.video_url}
              onChange={e => setNewLesson(n => ({ ...n, video_url: e.target.value }))}
              className="input w-full"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newLesson.is_free_preview}
                onChange={e => setNewLesson(n => ({ ...n, is_free_preview: e.target.checked }))}
                className="rounded"
              />
              Free preview lesson
            </label>
            <button
              onClick={addLesson}
              disabled={addingLesson || !newLesson.title.trim()}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {addingLesson ? 'Adding…' : '+ Add Lesson'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; outline: none; }
        .label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem; }
      `}</style>
    </div>
  )
}
