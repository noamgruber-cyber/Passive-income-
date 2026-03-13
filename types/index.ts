export type UserRole = 'student' | 'instructor' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  stripe_account_id: string | null
  created_at: string
}

export interface Course {
  id: string
  instructor_id: string
  title: string
  slug: string
  description: string | null
  category: string
  price: number
  thumbnail_url: string | null
  preview_video_url: string | null
  status: 'draft' | 'published'
  platform_fee_pct: number
  created_at: string
  updated_at: string
  instructor?: Profile
  lessons?: Lesson[]
  enrollment_count?: number
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  video_url: string | null
  duration_seconds: number
  sort_order: number
  is_free_preview: boolean
  created_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  stripe_payment_intent_id: string | null
  amount_paid: number | null
  enrolled_at: string
  course?: Course
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  last_watched_at: string
}

export const CATEGORIES = [
  'Programming',
  'Design',
  'Business',
  'Marketing',
  'Photography',
  'Music',
  'Health & Fitness',
  'Personal Development',
  'Finance',
  'Language',
] as const

export type Category = (typeof CATEGORIES)[number]
