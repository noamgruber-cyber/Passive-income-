'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPlayer = dynamic(() => import('react-player') as any, { ssr: false })

interface VideoPlayerProps {
  url: string
  lessonId: string
  onComplete?: () => void
}

export default function VideoPlayer({ url, lessonId, onComplete }: VideoPlayerProps) {
  const [completed, setCompleted] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleProgress = (state: any) => {
    const p: number = state.played
    if (p >= 0.9 && !completed) {
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
    } catch (err) {
      console.error('Failed to mark progress:', err)
    }
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
      {completed && (
        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">
          ✓ Complete
        </div>
      )}
    </div>
  )
}
