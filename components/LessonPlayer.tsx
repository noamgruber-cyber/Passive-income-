'use client'

import Link from 'next/link'
import { useState } from 'react'
import VideoPlayer from './VideoPlayer'

interface LessonPlayerProps {
  videoUrl: string
  lessonId: string
  lessonTitle: string
  nextLessonHref?: string
  isLastLesson: boolean
}

export default function LessonPlayer({
  videoUrl,
  lessonId,
  lessonTitle,
  nextLessonHref,
  isLastLesson,
}: LessonPlayerProps) {
  const [courseComplete, setCourseComplete] = useState(false)

  const handleComplete = () => {
    if (isLastLesson) setCourseComplete(true)
  }

  return (
    <div className="space-y-4">
      <VideoPlayer
        url={videoUrl}
        lessonId={lessonId}
        nextLessonHref={nextLessonHref}
        onComplete={handleComplete}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900">{lessonTitle}</h1>
      </div>

      {courseComplete && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-xl font-bold">Course Complete!</h2>
          <p className="mt-1 text-indigo-100 text-sm">
            Congratulations — you&apos;ve finished every lesson in this course.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block bg-white text-indigo-700 px-6 py-2 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-colors"
          >
            Back to My Learning
          </Link>
        </div>
      )}
    </div>
  )
}
