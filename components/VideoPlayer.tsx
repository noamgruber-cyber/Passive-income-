'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPlayer = dynamic(() => import('react-player') as any, { ssr: false })

interface VideoPlayerProps {
  url: string
  lessonId: string
  nextLessonHref?: string  // If provided, auto-advances after completion
  onComplete?: () => void
}

export default function VideoPlayer({ url, lessonId, nextLessonHref, onComplete }: VideoPlayerProps) {
  const [completed, setCompleted] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleProgress = (state: any) => {
    if (state.played >= 0.9 && !completed) {
      setCompleted(true)
      markComplete()
    }
  }

  const markComplete = async () => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, completed: true }),
      })
      onComplete?.()
      if (nextLessonHref) startCountdown(nextLessonHref)
    } catch (err) {
      console.error('Failed to mark progress:', err)
    }
  }

  const startCountdown = (href: string) => {
    let secs = 5
    setCountdown(secs)
    timerRef.current = setInterval(() => {
      secs -= 1
      if (secs <= 0) {
        clearInterval(timerRef.current!)
        router.push(href)
      } else {
        setCountdown(secs)
      }
    }, 1000)
  }

  const cancelCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(null)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Player = ReactPlayer as any

  return (
    <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
      <Player
        url={url}
        width="100%"
        height="100%"
        controls
        onProgress={handleProgress}
        progressInterval={5000}
      />

      {/* Completion badge (top-right) */}
      {completed && countdown === null && (
        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">
          ✓ Complete
        </div>
      )}

      {/* Auto-advance overlay */}
      {countdown !== null && nextLessonHref && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
          <div className="text-white text-center">
            <p className="text-lg font-semibold">Lesson complete!</p>
            <p className="text-sm text-gray-300 mt-1">Next lesson in {countdown}s…</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(nextLessonHref)}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Next Lesson →
            </button>
            <button
              onClick={cancelCountdown}
              className="bg-white/20 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
            >
              Stay
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
