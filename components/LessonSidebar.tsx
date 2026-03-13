'use client'

import Link from 'next/link'
import { Lesson, LessonProgress } from '@/types'
import { cn } from '@/lib/utils'

interface LessonSidebarProps {
  lessons: Lesson[]
  progress: LessonProgress[]
  currentLessonId: string
  courseSlug: string
}

export default function LessonSidebar({
  lessons,
  progress,
  currentLessonId,
  courseSlug,
}: LessonSidebarProps) {
  const completedIds = new Set(progress.filter(p => p.completed).map(p => p.lesson_id))
  const sorted = [...lessons].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-sm text-gray-900">Course Content</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {completedIds.size}/{lessons.length} completed
        </p>
      </div>
      <ul className="divide-y divide-gray-100">
        {sorted.map((lesson, i) => {
          const isActive = lesson.id === currentLessonId
          const isDone = completedIds.has(lesson.id)
          return (
            <li key={lesson.id}>
              <Link
                href={`/courses/${courseSlug}/learn/${lesson.id}`}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors',
                  isActive && 'bg-indigo-50 text-indigo-700'
                )}
              >
                <span className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold',
                  isDone
                    ? 'border-green-500 bg-green-500 text-white'
                    : isActive
                    ? 'border-indigo-500 text-indigo-500'
                    : 'border-gray-300 text-gray-400'
                )}>
                  {isDone ? '✓' : i + 1}
                </span>
                <span className={cn(
                  'flex-1 font-medium line-clamp-2',
                  isActive ? 'text-indigo-700' : 'text-gray-700'
                )}>
                  {lesson.title}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
